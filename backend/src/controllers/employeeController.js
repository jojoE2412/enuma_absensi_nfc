import { supabase } from "../config/supabase.js";

export async function getEmployees(req, res) {
  try {
    const { data: employees, error } = await supabase
      .from("employees")
      .select(`
        id, name, employee_number, status, created_at, updated_at,
        nfc_cards ( id, uid, status, employee_id )
      `)
      .order("created_at", { ascending: false });

    if (error) return res.status(400).json({ error: error.message });

    const result = employees.map(emp => ({
      ...emp,
      nfc_card: emp.nfc_cards?.find(c => c.status === "active" && c.employee_id === emp.id) || null
    }));

    return res.json({ data: result });
  } catch (error) {
    console.error("getEmployees Error:", error);
    return res.status(500).json({ error: "Gagal mengambil data karyawan." });
  }
}

export async function createEmployee(req, res) {
  try {
    const { name, employee_number, status } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Nama User wajib diisi." });
    }

    const empNumber = employee_number?.trim() || null;
    const empStatus = status === "inactive" ? "inactive" : "active";

    if (empNumber) {
      const { data: existing } = await supabase
        .from("employees")
        .select("id")
        .eq("employee_number", empNumber)
        .maybeSingle();

      if (existing) {
        return res.status(400).json({ error: `NIP/Nomor User (${empNumber}) sudah digunakan.` });
      }
    }

    const { data, error } = await supabase
      .from("employees")
      .insert({
        name: name.trim(),
        employee_number: empNumber,
        status: empStatus,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    return res.status(201).json({ message: "Data User berhasil ditambahkan.", data });
  } catch (error) {
    console.error("createEmployee Error:", error);
    return res.status(500).json({ error: "Gagal menambahkan data User." });
  }
}

export async function updateEmployee(req, res) {
  try {
    const { id } = req.params;
    const { name, employee_number, status } = req.body;

    if (!id) return res.status(400).json({ error: "ID User wajib disertakan." });

    const updateFields = { updated_at: new Date().toISOString() };
    if (name?.trim()) updateFields.name = name.trim();
    if (status && ["active", "inactive"].includes(status)) updateFields.status = status;
    if (employee_number !== undefined) {
      updateFields.employee_number = employee_number?.trim() || null;
    }

    const { data, error } = await supabase
      .from("employees")
      .update(updateFields)
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    return res.json({ message: "Data User berhasil diperbarui.", data });
  } catch (error) {
    console.error("updateEmployee Error:", error);
    return res.status(500).json({ error: "Gagal memperbarui data User." });
  }
}

/**
 * Hapus User dengan 2 mode:
 *   deleteAttendance=false (default) → Hapus User Saja
 *     - Lepas kartu (employee_id = NULL, status = inactive)
 *     - Attendance tetap ada (employee_id di-set NULL agar tidak orphan)
 *   deleteAttendance=true → Hapus User dan Data Absensinya
 *     - Hapus attendance
 *     - Lepas kartu (employee_id = NULL, status = inactive)
 *     - Hapus employee
 */
export async function deleteEmployee(req, res) {
  try {
    const { id } = req.params;
    const deleteAttendance = req.query.deleteAttendance === "true";

    if (!id) return res.status(400).json({ error: "ID User wajib disertakan." });

    // Verifikasi employee ada
    const { data: emp } = await supabase.from("employees").select("id, name").eq("id", id).maybeSingle();
    if (!emp) return res.status(404).json({ error: "User tidak ditemukan." });

    if (deleteAttendance) {
      // PILIHAN 2: Hapus attendance terlebih dahulu
      await supabase.from("attendance").delete().eq("employee_id", id);
    } else {
      // PILIHAN 1: Set employee_id = NULL pada attendance agar riwayat tetap ada
      // Kolom employee_id di attendance harus nullable untuk ini
      await supabase.from("attendance").update({ employee_id: null }).eq("employee_id", id);
    }

    // Lepas kartu dari User (employee_id = NULL, status = inactive)
    // Kartu tetap ada di database, bisa didaftarkan ke User lain
    await supabase
      .from("nfc_cards")
      .update({ employee_id: null, status: "inactive" })
      .eq("employee_id", id);

    // Hapus employee
    const { error } = await supabase.from("employees").delete().eq("id", id);
    if (error) return res.status(400).json({ error: error.message });

    const msg = deleteAttendance
      ? `User "${emp.name}" dan seluruh data absensinya berhasil dihapus.`
      : `User "${emp.name}" berhasil dihapus. Riwayat absensi tetap tersimpan.`;

    return res.json({ message: msg });
  } catch (error) {
    console.error("deleteEmployee Error:", error);
    return res.status(500).json({ error: "Gagal menghapus data User." });
  }
}
