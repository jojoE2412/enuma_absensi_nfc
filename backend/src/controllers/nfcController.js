import { supabase } from "../config/supabase.js";
import { nfcService } from "../services/nfcReader.js";
import { processNfcAttendance } from "./attendanceController.js";

export function streamNfcEvents(req, res) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  nfcService.addSSEClient(res);
  res.write(`event: connected\ndata: ${JSON.stringify({ message: "NFC SSE Stream Connected", readerStatus: nfcService.getReaderStatus() })}\n\n`);

  req.on("close", () => nfcService.removeSSEClient(res));
}

export function updateReaderStatus(req, res) {
  const { status, message, readerName } = req.body;
  const validStatuses = ["active", "waiting", "unavailable", "disconnected", "error"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Status reader tidak valid." });
  }
  nfcService.updateReaderStatus(status, message || "Status reader NFC diperbarui.", readerName || null);
  return res.json({ success: true, data: nfcService.getReaderStatus() });
}

export async function tapNfcCard(req, res) {
  const { uid } = req.body;
  if (!uid) return res.status(400).json({ error: "UID kartu wajib disertakan." });

  const cleanUid = uid.replace(/[^a-fA-F0-9]/g, "").toUpperCase();

  if (req.body.source === "acr122u") {
    nfcService.updateReaderStatus("active", "Reader NFC terdeteksi dan siap membaca kartu.");
  }

  nfcService.handleCardScan(cleanUid);
  await processNfcAttendance(req, res);
}

export async function getNfcListenerStatus(req, res) {
  return res.json({ data: nfcService.getListenerStatus() });
}

export async function startNfcListener(req, res) {
  try {
    const result = await nfcService.startListener();
    if (!result.success) return res.status(500).json({ error: result.error, data: result.data });
    return res.json({ message: result.alreadyRunning ? "Listener NFC sudah berjalan." : "Listener NFC berhasil dijalankan.", data: result.data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function stopNfcListener(req, res) {
  try {
    const result = nfcService.stopListener();
    return res.json({ message: "Listener NFC dihentikan.", data: result.data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getNfcCards(req, res) {
  try {
    const { data: cards, error } = await supabase
      .from("nfc_cards")
      .select(`
        id, uid, status, created_at, employee_id,
        employees ( id, name, employee_number, status )
      `)
      .order("created_at", { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ data: cards });
  } catch (error) {
    console.error("getNfcCards Error:", error);
    return res.status(500).json({ error: "Gagal mengambil daftar kartu NFC." });
  }
}

export async function deleteNfcCard(req, res) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "ID kartu wajib disertakan." });
    }

    const { data: existingCard, error: fetchError } = await supabase
      .from("nfc_cards")
      .select("id, uid")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) return res.status(400).json({ error: fetchError.message });
    if (!existingCard) return res.status(404).json({ error: "Kartu NFC tidak ditemukan." });

    const { error: deleteError } = await supabase.from("nfc_cards").delete().eq("id", id);
    if (deleteError) return res.status(400).json({ error: deleteError.message });

    return res.json({
      success: true,
      message: `Kartu NFC ${existingCard.uid} berhasil dihapus.`,
      data: existingCard
    });
  } catch (error) {
    console.error("deleteNfcCard Error:", error);
    return res.status(500).json({ error: "Gagal menghapus kartu NFC." });
  }
}

/**
 * Registrasi Kartu Baru — hanya untuk User yang BELUM memiliki kartu aktif.
 * Jika kartu sudah digunakan User lain → tolak.
 * Jika kartu ada di DB tapi employee_id NULL → hubungkan ke User.
 */
export async function registerNfcCard(req, res) {
  try {
    const { employee_id, uid } = req.body;
    if (!employee_id || !uid) {
      return res.status(400).json({ error: "User dan UID kartu wajib diisi." });
    }

    const cleanUid = uid.replace(/[^a-fA-F0-9]/g, "").toUpperCase();

    // Cek apakah User sudah punya kartu aktif
    const { data: existingActiveCard } = await supabase
      .from("nfc_cards")
      .select("id, uid")
      .eq("employee_id", employee_id)
      .eq("status", "active")
      .maybeSingle();

    if (existingActiveCard) {
      return res.status(400).json({
        error: `User ini sudah memiliki kartu aktif (UID: ${existingActiveCard.uid}). Gunakan fitur Ganti Kartu.`
      });
    }

    // Cek apakah UID sudah digunakan User lain
    const { data: existingCard, error: checkError } = await supabase
      .from("nfc_cards")
      .select("id, employee_id, status, employees(name)")
      .eq("uid", cleanUid)
      .maybeSingle();

    if (checkError) return res.status(400).json({ error: checkError.message });

    if (existingCard && existingCard.employee_id && existingCard.employee_id !== employee_id) {
      const ownerName = existingCard.employees?.name || "User lain";
      return res.status(400).json({
        error: `Kartu UID (${cleanUid}) sudah terdaftar pada ${ownerName}.`
      });
    }

    if (existingCard) {
      // Kartu ada di DB (employee_id NULL atau milik User ini) → update
      const { data: updatedCard, error: updateErr } = await supabase
        .from("nfc_cards")
        .update({ employee_id, status: "active" })
        .eq("id", existingCard.id)
        .select("*, employees(name)")
        .single();

      if (updateErr) return res.status(400).json({ error: updateErr.message });
      return res.status(201).json({ message: "Kartu NFC berhasil dihubungkan ke User.", data: updatedCard });
    }

    // Kartu baru, belum ada di DB → insert
    const { data: newCard, error: insertErr } = await supabase
      .from("nfc_cards")
      .insert({ employee_id, uid: cleanUid, status: "active" })
      .select("*, employees(name)")
      .single();

    if (insertErr) return res.status(400).json({ error: insertErr.message });
    return res.status(201).json({ message: "Kartu NFC berhasil didaftarkan.", data: newCard });
  } catch (error) {
    console.error("registerNfcCard Error:", error);
    return res.status(500).json({ error: "Gagal mendaftarkan kartu NFC." });
  }
}

/**
 * Ganti Kartu — untuk User yang sudah memiliki kartu aktif.
 * Alur:
 *   1. Validasi User punya kartu aktif (kartu lama).
 *   2. Validasi UID baru tidak digunakan User lain.
 *   3. Simpan kartu baru (insert/update) dengan employee_id = User.
 *   4. SETELAH berhasil → lepas kartu lama (employee_id = NULL, status = inactive).
 *   Jika langkah 3 gagal → kartu lama tetap terhubung.
 */
export async function changeNfcCard(req, res) {
  try {
    const { employee_id, new_uid } = req.body;
    if (!employee_id || !new_uid) {
      return res.status(400).json({ error: "User dan UID kartu baru wajib diisi." });
    }

    const cleanNewUid = new_uid.replace(/[^a-fA-F0-9]/g, "").toUpperCase();

    // Ambil kartu lama yang aktif milik User ini
    const { data: oldCard } = await supabase
      .from("nfc_cards")
      .select("id, uid")
      .eq("employee_id", employee_id)
      .eq("status", "active")
      .maybeSingle();

    if (!oldCard) {
      return res.status(400).json({ error: "User tidak memiliki kartu aktif. Gunakan fitur Registrasi Kartu." });
    }

    // Jika UID baru sama dengan kartu lama
    if (oldCard.uid === cleanNewUid) {
      return res.status(400).json({ error: "UID kartu baru sama dengan kartu yang sedang aktif." });
    }

    // Cek apakah UID baru sudah digunakan User lain
    const { data: conflictCard } = await supabase
      .from("nfc_cards")
      .select("id, employee_id, employees(name)")
      .eq("uid", cleanNewUid)
      .maybeSingle();

    if (conflictCard && conflictCard.employee_id && conflictCard.employee_id !== employee_id) {
      const ownerName = conflictCard.employees?.name || "User lain";
      return res.status(400).json({
        error: `Kartu UID (${cleanNewUid}) sudah terdaftar pada ${ownerName}. Kartu lama tetap aktif.`
      });
    }

    // Simpan kartu baru terlebih dahulu
    let newCard;
    if (conflictCard) {
      // Kartu ada di DB (employee_id NULL) → update
      const { data, error: updateErr } = await supabase
        .from("nfc_cards")
        .update({ employee_id, status: "active" })
        .eq("id", conflictCard.id)
        .select("*, employees(name)")
        .single();

      if (updateErr) return res.status(400).json({ error: `Gagal menyimpan kartu baru: ${updateErr.message}. Kartu lama tetap aktif.` });
      newCard = data;
    } else {
      // Kartu baru, belum ada di DB → insert
      const { data, error: insertErr } = await supabase
        .from("nfc_cards")
        .insert({ employee_id, uid: cleanNewUid, status: "active" })
        .select("*, employees(name)")
        .single();

      if (insertErr) return res.status(400).json({ error: `Gagal menyimpan kartu baru: ${insertErr.message}. Kartu lama tetap aktif.` });
      newCard = data;
    }

    // Kartu baru berhasil disimpan → baru lepas kartu lama
    await supabase
      .from("nfc_cards")
      .update({ employee_id: null, status: "inactive" })
      .eq("id", oldCard.id);

    return res.json({
      message: `Kartu berhasil diganti. Kartu lama (${oldCard.uid}) dilepas.`,
      data: newCard,
      oldCardUid: oldCard.uid
    });
  } catch (error) {
    console.error("changeNfcCard Error:", error);
    return res.status(500).json({ error: "Gagal mengganti kartu NFC." });
  }
}

/**
 * Nonaktifkan / Aktifkan kartu NFC (toggle status).
 * Nonaktifkan: status = inactive, employee_id tetap (tidak dilepas).
 */
export async function toggleNfcCardStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id || !["active", "inactive"].includes(status)) {
      return res.status(400).json({ error: "ID kartu dan status valid ('active'/'inactive') diperlukan." });
    }

    const { data, error } = await supabase
      .from("nfc_cards")
      .update({ status })
      .eq("id", id)
      .select("*, employees(name)")
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ message: `Status kartu berhasil diubah menjadi ${status}.`, data });
  } catch (error) {
    console.error("toggleNfcCardStatus Error:", error);
    return res.status(500).json({ error: "Gagal mengubah status kartu." });
  }
}
