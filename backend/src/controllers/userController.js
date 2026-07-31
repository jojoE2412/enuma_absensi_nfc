import { supabase } from "../config/supabase.js";

/**
 * Get all users / profiles with their registered NFC cards.
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
        created_at,
        nfc_cards (
          id,
          uid,
          status
        )
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
      nfc_card: p.nfc_cards?.find(c => c.status === "active") || p.nfc_cards?.[0] || null
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

    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, password, dan nama wajib diisi." });
    }

    const validRole = role === "admin" ? "admin" : "operator";
    const validStatus = status === "inactive" ? "inactive" : "active";

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role: validRole }
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
        name,
        role: validRole,
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
      data: { ...profile, email }
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

    if (!id) {
      return res.status(400).json({ error: "ID user wajib disertakan." });
    }

    const updateFields = {};
    if (name) updateFields.name = name;
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

    // Update Auth user if email or password provided
    const authUpdate = {};
    if (email) authUpdate.email = email;
    if (password) authUpdate.password = password;

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
