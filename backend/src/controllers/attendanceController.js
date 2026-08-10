import { supabase } from "../config/supabase.js";
import { nfcService } from "../services/nfcReader.js";

// Cooldown 15 menit setelah check-in berhasil untuk mencegah double tap
const lastCheckInMap = new Map();
const COOLDOWN_MS = 15 * 60 * 1000; // 15 menit

function getWibDateTime() {
  const now = new Date();
  const wibDateStr = now.toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" }); // YYYY-MM-DD
  const wibTimeStr = now.toLocaleTimeString("en-US", {
    timeZone: "Asia/Jakarta",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
  const [hStr, mStr] = wibTimeStr.split(":");
  const hours = parseInt(hStr, 10);
  const minutes = parseInt(mStr, 10);
  const timeDecimal = hours + minutes / 60;
  return { now, wibDateStr, wibTimeStr, hours, minutes, timeDecimal };
}

export async function processNfcAttendance(req, res) {
  try {
    const { uid } = req.body;
    if (!uid) {
      return res.status(400).json({ success: false, error: "UID kartu NFC wajib diisi." });
    }

    const cleanUid = uid.replace(/[^a-fA-F0-9]/g, "").toUpperCase();
    const { now, wibDateStr, wibTimeStr, timeDecimal } = getWibDateTime();

    // ── 1. VALIDASI KARTU ────────────────────────────────────────────────────
    const { data: card, error: cardError } = await supabase
      .from("nfc_cards")
      .select("id, employee_id, status, uid, employees(id, name, employee_number, status)")
      .eq("uid", cleanUid)
      .maybeSingle();

    if (cardError) return res.status(400).json({ success: false, error: cardError.message });

    if (!card) {
      const errResp = { success: false, error: "Kartu NFC tidak terdaftar.", uid: cleanUid };
      nfcService.broadcastSSE("attendance_failed", errResp);
      return res.status(404).json(errResp);
    }

    if (card.status !== "active") {
      const errResp = { success: false, error: "Kartu NFC tidak aktif.", uid: cleanUid, employeeName: card.employees?.name };
      nfcService.broadcastSSE("attendance_failed", errResp);
      return res.status(403).json(errResp);
    }

    // Kartu dengan employee_id NULL tidak boleh digunakan
    if (!card.employee_id) {
      const errResp = { success: false, error: "Kartu NFC tidak terhubung ke User manapun.", uid: cleanUid };
      nfcService.broadcastSSE("attendance_failed", errResp);
      return res.status(403).json(errResp);
    }

    const employee = card.employees;
    if (!employee) {
      const errResp = { success: false, error: "User tidak ditemukan.", uid: cleanUid };
      nfcService.broadcastSSE("attendance_failed", errResp);
      return res.status(403).json(errResp);
    }

    const employeeId = employee.id;

    // ── 2. AMBIL RECORD ATTENDANCE ────────────────────────────────────────────
    // Pukul 00:00–05:59: cek dulu sesi kemarin yang belum check-out
    let existing = null;
    if (timeDecimal < 6.0) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
      const { data: prevRecord, error: prevErr } = await supabase
        .from("attendance")
        .select("*")
        .eq("employee_id", employeeId)
        .eq("date", yesterdayStr)
        .maybeSingle();
      if (prevErr) return res.status(400).json({ success: false, error: prevErr.message });
      if (prevRecord && prevRecord.check_in && !prevRecord.check_out) {
        existing = prevRecord;
      }
    }

    if (!existing) {
      const { data: todayRecord, error: todayErr } = await supabase
        .from("attendance")
        .select("*")
        .eq("employee_id", employeeId)
        .eq("date", wibDateStr)
        .maybeSingle();
      if (todayErr) return res.status(400).json({ success: false, error: todayErr.message });
      existing = todayRecord;
    }

    // ── 3. BELUM ADA RECORD → CHECK-IN ───────────────────────────────────────
    if (!existing) {
      // Tolak sebelum 06:00 WIB
      if (timeDecimal < 6.0) {
        const errResp = {
          success: false,
          error: "Absensi masuk belum dibuka. Absensi dimulai pukul 06.00 WIB.",
          employeeName: employee.name,
          time: wibTimeStr
        };
        nfcService.broadcastSSE("attendance_failed", errResp);
        return res.status(400).json(errResp);
      }

      // Tolak pukul 16:00 ke atas — batas absen masuk sudah tutup
      if (timeDecimal >= 16.0) {
        const errResp = {
          success: false,
          error: "Absensi masuk sudah ditutup. Waktu absensi masuk hanya sampai sebelum pukul 16.00 WIB.",
          employeeName: employee.name,
          time: wibTimeStr
        };
        nfcService.broadcastSSE("attendance_failed", errResp);
        return res.status(400).json(errResp);
      }

      // 06:00–09:00 → on_time, 09:01–15:59 → late
      const checkInStatus = timeDecimal <= 9.0 ? "on_time" : "late";
      const statusLabel = checkInStatus === "on_time" ? "Tepat Waktu" : "Terlambat";

      const { data: newRecord, error: insertErr } = await supabase
        .from("attendance")
        .insert({
          employee_id: employeeId,
          date: wibDateStr,
          check_in: now.toISOString(),
          check_in_status: checkInStatus
        })
        .select("*, employees(name, employee_number)")
        .single();

      if (insertErr) {
        if (insertErr.code === "23505") {
          return res.status(400).json({ success: false, error: "Anda sudah melakukan absensi masuk hari ini." });
        }
        return res.status(400).json({ success: false, error: insertErr.message });
      }

      // Catat waktu check-in untuk cooldown 15 menit
      lastCheckInMap.set(employeeId, now.getTime());

      const responsePayload = {
        success: true,
        type: "check_in",
        message: `Absensi Masuk Berhasil (${statusLabel})`,
        data: newRecord,
        employeeName: employee.name,
        time: wibTimeStr,
        statusLabel
      };
      nfcService.broadcastSSE("attendance_success", responsePayload);
      return res.json(responsePayload);
    }

    // ── 4. SUDAH CHECK-IN DAN CHECK-OUT → TOLAK ──────────────────────────────
    if (existing.check_in && existing.check_out) {
      const errResp = {
        success: false,
        error: "Anda sudah melakukan absensi masuk dan pulang hari ini.",
        employeeName: employee.name
      };
      nfcService.broadcastSSE("attendance_failed", errResp);
      return res.status(400).json(errResp);
    }

    // ── 5. SUDAH CHECK-IN, BELUM CHECK-OUT → PROSES CHECK-OUT ────────────────

    // 5a. Cegah double tap — cooldown 15 menit sejak check-in
    // Cooldown TIDAK direset saat ditolak, TIDAK dianggap check-out
    const lastCheckInTime = lastCheckInMap.get(employeeId);
    if (lastCheckInTime && (now.getTime() - lastCheckInTime) < COOLDOWN_MS) {
      const sisaMenit = Math.ceil((COOLDOWN_MS - (now.getTime() - lastCheckInTime)) / 60000);
      const errResp = {
        success: false,
        error: `Double tap terdeteksi. Tunggu ${sisaMenit} menit lagi untuk absen pulang.`,
        employeeName: employee.name,
        sisaMenit,
        time: wibTimeStr
      };
      nfcService.broadcastSSE("double_tap", errResp);
      return res.status(429).json(errResp);
    }

    // 5b. Tentukan status check-out
    // 00:00–05:59 → overtime (Lembur, lanjutan sesi sebelumnya)
    // 06:00–15:59 → early_leave (Mendahului Pulang)
    // 16:00–18:00 → normal (Pulang Normal)
    // 18:01–23:59 → overtime (Lembur)
    let checkOutStatus, statusLabel;
    if (timeDecimal < 6.0) {
      checkOutStatus = "overtime";
      statusLabel = "Lembur";
    } else if (timeDecimal < 16.0) {
      checkOutStatus = "early_leave";
      statusLabel = "Mendahului Pulang";
    } else if (timeDecimal <= 18.0) {
      checkOutStatus = "normal";
      statusLabel = "Pulang Normal";
    } else {
      checkOutStatus = "overtime";
      statusLabel = "Lembur";
    }

    // 5c. Simpan check-out
    const { data: updatedRecord, error: updateErr } = await supabase
      .from("attendance")
      .update({
        check_out: now.toISOString(),
        check_out_status: checkOutStatus
      })
      .eq("id", existing.id)
      .select("*, employees(name, employee_number)")
      .single();

    if (updateErr) return res.status(400).json({ success: false, error: updateErr.message });

    // Hapus dari cooldown map setelah check-out berhasil
    lastCheckInMap.delete(employeeId);

    const responsePayload = {
      success: true,
      type: "check_out",
      message: `Absensi Pulang Berhasil (${statusLabel})`,
      data: updatedRecord,
      employeeName: employee.name,
      time: wibTimeStr,
      statusLabel
    };
    nfcService.broadcastSSE("attendance_success", responsePayload);
    return res.json(responsePayload);

  } catch (error) {
    console.error("processNfcAttendance Error:", error);
    return res.status(500).json({ success: false, error: "Gagal memproses absensi NFC." });
  }
}

export async function manualAttendance(req, res) {
  try {
    const { employee_id, type } = req.body;
    if (!employee_id || !type) {
      return res.status(400).json({ success: false, error: "employee_id dan type (check_in/check_out) wajib diisi." });
    }

    const { now, wibDateStr, wibTimeStr, timeDecimal } = getWibDateTime();

    const { data: employee } = await supabase
      .from("employees")
      .select("id, name, employee_number")
      .eq("id", employee_id)
      .maybeSingle();

    if (!employee) return res.status(404).json({ success: false, error: "Karyawan tidak ditemukan." });

    if (type === "check_in") {
      const { data: existing } = await supabase
        .from("attendance")
        .select("id")
        .eq("employee_id", employee_id)
        .eq("date", wibDateStr)
        .maybeSingle();

      if (existing) return res.status(400).json({ success: false, error: "Karyawan sudah absen masuk hari ini." });

      const checkInStatus = timeDecimal <= 9.0 ? "on_time" : "late";
      const { data: newRecord, error: insertErr } = await supabase
        .from("attendance")
        .insert({ employee_id, date: wibDateStr, check_in: now.toISOString(), check_in_status: checkInStatus, manual: true })
        .select("*, employees(name, employee_number)")
        .single();

      if (insertErr) return res.status(400).json({ success: false, error: insertErr.message });

      lastCheckInMap.set(employee_id, now.getTime());

      const payload = {
        success: true, type: "check_in", manual: true,
        message: `Absensi Masuk Manual Berhasil (${checkInStatus === "on_time" ? "Tepat Waktu" : "Terlambat"})`,
        data: newRecord, employeeName: employee.name, time: wibTimeStr
      };
      nfcService.broadcastSSE("attendance_success", payload);
      return res.json(payload);
    }

    if (type === "check_out") {
      let existing = null;
      if (timeDecimal < 6.0) {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
        const { data: prev } = await supabase.from("attendance").select("*").eq("employee_id", employee_id).eq("date", yesterdayStr).maybeSingle();
        if (prev && prev.check_in && !prev.check_out) existing = prev;
      }
      if (!existing) {
        const { data: today } = await supabase.from("attendance").select("*").eq("employee_id", employee_id).eq("date", wibDateStr).maybeSingle();
        existing = today;
      }

      if (!existing || !existing.check_in) return res.status(400).json({ success: false, error: "Karyawan belum absen masuk." });
      if (existing.check_out) return res.status(400).json({ success: false, error: "Karyawan sudah absen pulang." });

      const lastCheckInTime = lastCheckInMap.get(employee_id);
      if (lastCheckInTime && (now.getTime() - lastCheckInTime) < COOLDOWN_MS) {
        const sisaMenit = Math.ceil((COOLDOWN_MS - (now.getTime() - lastCheckInTime)) / 60000);
        return res.status(429).json({ success: false, error: `Double click terdeteksi. Tunggu ${sisaMenit} menit lagi untuk absen pulang.` });
      }

      let checkOutStatus;
      if (timeDecimal < 6.0) checkOutStatus = "overtime";
      else if (timeDecimal < 16.0) checkOutStatus = "early_leave";
      else if (timeDecimal <= 18.0) checkOutStatus = "normal";
      else checkOutStatus = "overtime";

      const { data: updated, error: updateErr } = await supabase
        .from("attendance")
        .update({ check_out: now.toISOString(), check_out_status: checkOutStatus, manual: true })
        .eq("id", existing.id)
        .select("*, employees(name, employee_number)")
        .single();

      if (updateErr) return res.status(400).json({ success: false, error: updateErr.message });

      lastCheckInMap.delete(employee_id);

      const statusLabel = checkOutStatus === "early_leave" ? "Mendahului Pulang" : checkOutStatus === "normal" ? "Pulang Normal" : "Lembur";
      const payload = {
        success: true, type: "check_out", manual: true,
        message: `Absensi Pulang Manual Berhasil (${statusLabel})`,
        data: updated, employeeName: employee.name, time: wibTimeStr
      };
      nfcService.broadcastSSE("attendance_success", payload);
      return res.json(payload);
    }

    return res.status(400).json({ success: false, error: "type harus check_in atau check_out." });
  } catch (error) {
    console.error("manualAttendance Error:", error);
    return res.status(500).json({ success: false, error: "Gagal memproses absensi manual." });
  }
}

export async function getAttendanceList(req, res) {
  try {
    const { startDate, endDate, search, limit = 200 } = req.query;

    let query = supabase
      .from("attendance")
      .select(`
        id, employee_id, date, check_in, check_out,
        check_in_status, check_out_status, manual, created_at,
        employees ( id, name, employee_number, status )
      `)
      .order("date", { ascending: false })
      .order("check_in", { ascending: false })
      .limit(Number(limit));

    if (startDate) query = query.gte("date", startDate);
    if (endDate) query = query.lte("date", endDate);

    const { data: records, error } = await query;
    if (error) return res.status(400).json({ error: error.message });

    let filtered = records;
    if (search && search.trim() !== "") {
      const s = search.toLowerCase();
      filtered = records.filter(r =>
        r.employees?.name?.toLowerCase().includes(s) ||
        r.employees?.employee_number?.toLowerCase().includes(s)
      );
    }

    return res.json({ data: filtered });
  } catch (error) {
    console.error("getAttendanceList Error:", error);
    return res.status(500).json({ error: "Gagal mengambil riwayat absensi." });
  }
}

export async function getDashboardStats(req, res) {
  try {
    const { wibDateStr } = getWibDateTime();

    const { count: totalEmployees } = await supabase
      .from("employees")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    const { data: todayAttendance, error } = await supabase
      .from("attendance")
      .select("*, employees(name, employee_number)")
      .eq("date", wibDateStr);

    if (error) return res.status(400).json({ error: error.message });

    const totalAbsensiHariIni = todayAttendance.length;
    // Total Hadir = semua yang check-in (on_time + late)
    const totalHadir = todayAttendance.filter(a => a.check_in != null).length;
    const totalTerlambat = todayAttendance.filter(a => a.check_in_status === "late").length;
    const totalLembur = todayAttendance.filter(a => a.check_out_status === "overtime").length;

    return res.json({
      data: {
        totalEmployees: totalEmployees || 0,
        totalAbsensiHariIni,
        totalHadir,
        totalTerlambat,
        totalLembur,
        todayRecords: todayAttendance
      }
    });
  } catch (error) {
    console.error("getDashboardStats Error:", error);
    return res.status(500).json({ error: "Gagal mengambil statistik dashboard." });
  }
}
