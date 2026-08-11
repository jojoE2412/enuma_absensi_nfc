import { supabase } from "../config/supabase.js";

const VALID_ROLES = new Set(["admin", "operator"]);
const VALID_STATUSES = new Set(["active", "inactive"]);

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizeName(name) {
  return String(name || "").trim();
}

/**
 * Get all login users / profiles.
 */
export async function getUsers(req, res) {
  try {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select(`
        id,
        name,
        role,
        status,
        created_at
      `)
      .order("created_at", { ascending: false });

    if (profilesError) {
      return res.status(400).json({ error: profilesError.message });
    }

    // Also fetch auth users to combine email info
    const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
    
    const emailMap = new Map();
    if (!authError && authUsers) {
      authUsers.forEach(u => emailMap.set(u.id, u.email));
    }

    const result = profiles.map(p => ({
      ...p,
      email: emailMap.get(p.id) || "-",
      nfc_card: null
    }));

    return res.json({ data: result });
  } catch (error) {
    console.error("getUsers Error:", error);
    return res.status(500).json({ error: "Gagal mengambil data user." });
  }
}

/**
 * Create a new user (Auth + Profile).
 */
export async function createUser(req, res) {
  try {
    const { email, password, name, role, status } = req.body;
    const cleanEmail = normalizeEmail(email);
    const cleanName = normalizeName(name);

    if (!cleanEmail || !password || !cleanName) {
      return res.status(400).json({ error: "Email, password, dan nama wajib diisi." });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password minimal 6 karakter." });
    }

    if (!VALID_ROLES.has(role)) {
      return res.status(400).json({ error: "Role user tidak valid." });
    }

    const validStatus = VALID_STATUSES.has(status) ? status : "active";

    const { data: existingAuthUsers, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      return res.status(400).json({ error: listError.message });
    }

    const emailExists = existingAuthUsers?.users?.some(
      (user) => normalizeEmail(user.email) === cleanEmail
    );
    if (emailExists) {
      return res.status(409).json({ error: "Email sudah digunakan oleh akun lain." });
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: { name: cleanName, role }
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    const userId = authData.user.id;

    // Upsert into profiles table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        name: cleanName,
        role,
        status: validStatus
      })
      .select()
      .single();

    if (profileError) {
      // Rollback auth user if profile insert fails
      await supabase.auth.admin.deleteUser(userId);
      return res.status(400).json({ error: profileError.message });
    }

    return res.status(201).json({
      message: "User berhasil dibuat.",
      data: { ...profile, email: cleanEmail }
    });
  } catch (error) {
    console.error("createUser Error:", error);
    return res.status(500).json({ error: "Gagal membuat user baru." });
  }
}

/**
 * Update an existing user.
 */
export async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { name, role, status, email, password } = req.body;
    const cleanEmail = normalizeEmail(email);
    const cleanName = name === undefined ? undefined : normalizeName(name);

    if (!id) {
      return res.status(400).json({ error: "ID user wajib disertakan." });
    }

    if (role && !VALID_ROLES.has(role)) {
      return res.status(400).json({ error: "Role user tidak valid." });
    }

    if (status && !VALID_STATUSES.has(status)) {
      return res.status(400).json({ error: "Status user tidak valid." });
    }

    if (cleanName !== undefined && !cleanName) {
      return res.status(400).json({ error: "Nama wajib diisi." });
    }

    if (password && password.length < 6) {
      return res.status(400).json({ error: "Password minimal 6 karakter." });
    }

    const authUpdate = {};
    if (cleanEmail) {
      const { data: existingAuthUsers, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) {
        return res.status(400).json({ error: listError.message });
      }

      const emailExists = existingAuthUsers?.users?.some(
        (user) => user.id !== id && normalizeEmail(user.email) === cleanEmail
      );
      if (emailExists) {
        return res.status(409).json({ error: "Email sudah digunakan oleh akun lain." });
      }

      authUpdate.email = cleanEmail;
    }
    if (password) authUpdate.password = password;

    const updateFields = {};
    if (cleanName !== undefined) updateFields.name = cleanName;
    if (role) updateFields.role = role;
    if (status) updateFields.status = status;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .update(updateFields)
      .eq("id", id)
      .select()
      .single();

    if (profileError) {
      return res.status(400).json({ error: profileError.message });
    }

    if (Object.keys(authUpdate).length > 0) {
      await supabase.auth.admin.updateUserById(id, authUpdate);
    }

    return res.json({
      message: "User berhasil diperbarui.",
      data: profile
    });
  } catch (error) {
    console.error("updateUser Error:", error);
    return res.status(500).json({ error: "Gagal memperbarui data user." });
  }
}

/**
 * Delete a user and clean up relationships (nfc_cards, attendance) to prevent orphans.
 */
export async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "ID user wajib disertakan." });
    }

    // Prevent Admin from deleting their own account
    if (req.user.id === id) {
      return res.status(400).json({ error: "Anda tidak dapat menghapus akun Anda sendiri." });
    }

    // 1. Delete user's attendance records
    await supabase.from("attendance").delete().eq("user_id", id);

    // 2. Delete user's NFC cards
    await supabase.from("nfc_cards").delete().eq("user_id", id);

    // 3. Delete profile
    const { error: profileError } = await supabase.from("profiles").delete().eq("id", id);
    if (profileError) {
      return res.status(400).json({ error: profileError.message });
    }

    // 4. Delete Auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    if (authError) {
      console.warn("Warn: Auth user deletion error:", authError.message);
    }

    return res.json({ message: "User dan seluruh data terkait berhasil dihapus." });
  } catch (error) {
    console.error("deleteUser Error:", error);
    return res.status(500).json({ error: "Gagal menghapus user." });
  }
}
