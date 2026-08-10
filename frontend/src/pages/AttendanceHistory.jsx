import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import DatePicker from "../components/DatePicker";
import { labelCheckIn, labelCheckOut, badgeCheckIn, badgeCheckOut } from "../lib/statusHelpers";
import * as XLSX from "xlsx-js-style";
import MonthlyReport from "./MonthlyReport";
import { Clock, Search, CalendarDays, FileSpreadsheet, Printer, FileDown } from "lucide-react";

function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const MONTHS = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember"
];

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

const pad = (n) => String(n).padStart(2, "0");

const statusColor = (status) => ({ on_time: "15803D", late: "CA8A04", early_leave: "EA580C", normal: "2563EB", overtime: "7C3AED" }[status] || "1F2937");
const attendanceSymbol = (record) => record?.manual ? "☑" : "✓";

export default function AttendanceHistory() {
  const { session } = useAuth();
  const [records,   setRecords]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate,   setEndDate]   = useState("");

  const now = new Date();
  const [exportMonth, setExportMonth] = useState(now.getMonth() + 1);
  const [exportYear,  setExportYear]  = useState(now.getFullYear());
  const [exportLoading, setExportLoading] = useState(false);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [showMonthlyReport, setShowMonthlyReport] = useState(false);

  async function fetchHistory(overrideSearch) {
    try {
      setLoading(true);
      const q = overrideSearch !== undefined ? overrideSearch : search;
      let url = `http://localhost:3001/api/attendance?search=${encodeURIComponent(q)}&limit=500`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate)   url += `&endDate=${endDate}`;
      const res  = await fetch(url, { headers: { Authorization: `Bearer ${session?.access_token}` } });
      const json = await res.json();
      if (json.data) setRecords(json.data);
    } catch (err) { console.error("fetchHistory error:", err); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchHistory(); }, [session, startDate, endDate]);

  const handleSearchSubmit = (e) => { e.preventDefault(); fetchHistory(search); };

  // Export Excel bulanan — format daftar hadir
  const handleExportMonthly = async () => {
    setExportLoading(true);
    try {
      const year  = exportYear;
      const month = exportMonth;
      const totalDays = daysInMonth(year, month);
      const startStr = `${year}-${pad(month)}-01`;
      const endStr   = `${year}-${pad(month)}-${pad(totalDays)}`;

      const res  = await fetch(
        `http://localhost:3001/api/attendance?startDate=${startStr}&endDate=${endStr}&limit=1000`,
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      );
      const json = await res.json();
      const data = json.data || [];

      const empMap = new Map();
      for (const r of data) {
        if (r.employees?.id && !empMap.has(r.employees.id))
          empMap.set(r.employees.id, { id: r.employees.id, name: r.employees.name || "-", nip: r.employees.employee_number || "-" });
      }
      const employees = [...empMap.values()].sort((a, b) => a.name.localeCompare(b.name));

      const lookup = {};
      for (const r of data) {
        if (!r.employees?.id) continue;
        if (!lookup[r.employees.id]) lookup[r.employees.id] = {};
        lookup[r.employees.id][r.date] = r;
      }

      const monthLabel = MONTHS[month - 1];
      // Struktur: 3 kolom tetap + totalDays * 2 kolom (Masuk+Pulang per hari)
      const totalCols = 3 + totalDays * 2;

      // Baris 0: judul
      const row0 = ["LAPORAN ABSENSI — ABSENSI ENUMA TECHNOLOGY", ...Array(totalCols - 1).fill("")];
      // Baris 1: bulan
      const row1 = [`Bulan: ${monthLabel} ${year}`, ...Array(totalCols - 1).fill("")];
      // Baris 2: header tanggal — No | Nama | NIP | 1 | "" | 2 | "" | ...
      const row2 = ["No", "Nama Karyawan", "NIP"];
      for (let d = 1; d <= totalDays; d++) row2.push(d, "");
      // Baris 3: sub-header M/P
      const row3 = ["", "", ""];
      for (let d = 1; d <= totalDays; d++) row3.push("M", "P");
      // Baris 4+: data — simbol M/P
      const dataRows = employees.map((emp, idx) => {
        const row = [idx + 1, emp.name, emp.nip];
        for (let d = 1; d <= totalDays; d++) {
          const dateStr = `${year}-${pad(month)}-${pad(d)}`;
          const rec = lookup[emp.id]?.[dateStr];
          row.push(rec?.check_in ? attendanceSymbol(rec) : "", rec?.check_out ? attendanceSymbol(rec) : "");
        }
        return row;
      });

      const legendRows = [
        ["Keterangan: ✓ = kartu, ☑ = manual. Kolom M = masuk, P = pulang.", ...Array(totalCols - 1).fill("")],
        ["Warna status: hijau = tepat waktu, kuning-oranye = terlambat, oranye = mendahului pulang, biru = pulang normal, ungu = lembur.", ...Array(totalCols - 1).fill("")],
      ];
      const sheetData = [row0, row1, row2, row3, ...dataRows, ...legendRows];
      const ws = XLSX.utils.aoa_to_sheet(sheetData);

      // Merges
      const merges = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: totalCols - 1 } },
        { s: { r: 2, c: 0 }, e: { r: 3, c: 0 } },
        { s: { r: 2, c: 1 }, e: { r: 3, c: 1 } },
        { s: { r: 2, c: 2 }, e: { r: 3, c: 2 } },
      ];
      for (let d = 0; d < totalDays; d++) {
        const c = 3 + d * 2;
        merges.push({ s: { r: 2, c }, e: { r: 2, c: c + 1 } });
      }
      const legendStartRow = 4 + employees.length;
      merges.push({ s: { r: legendStartRow, c: 0 }, e: { r: legendStartRow, c: totalCols - 1 } });
      merges.push({ s: { r: legendStartRow + 1, c: 0 }, e: { r: legendStartRow + 1, c: totalCols - 1 } });
      ws["!merges"] = merges;
      ws["!cols"] = [{ wch: 4 }, { wch: 26 }, { wch: 16 }, ...Array(totalDays * 2).fill({ wch: 3 })];
      ws["!rows"] = [{ hpt: 24 }, { hpt: 18 }, { hpt: 20 }, { hpt: 18 }, ...employees.map(() => ({ hpt: 18 }))];
      ws["!freeze"] = { xSplit: 3, ySplit: 4, topLeftCell: "D5", activePane: "bottomRight", state: "frozen" };
      ws["!pageSetup"] = { orientation: "landscape", fitToWidth: 1, fitToHeight: 0, paperSize: 9 };
      ws["!sheetViews"] = [{ showGridLines: false }];

      const border = {
        top: { style: "thin", color: { rgb: "B7C5D3" } }, bottom: { style: "thin", color: { rgb: "B7C5D3" } },
        left: { style: "thin", color: { rgb: "B7C5D3" } }, right: { style: "thin", color: { rgb: "B7C5D3" } },
      };
      const titleStyle = { font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "1F4E78" } }, alignment: { horizontal: "left", vertical: "center" } };
      const monthStyle = { font: { bold: true, sz: 11, color: { rgb: "1F2937" } }, fill: { fgColor: { rgb: "DCE6F1" } }, alignment: { horizontal: "left", vertical: "center" } };
      const headerStyle = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "2F75B5" } }, border, alignment: { horizontal: "center", vertical: "center" } };
      const subHeaderStyle = { font: { bold: true, color: { rgb: "1F2937" } }, fill: { fgColor: { rgb: "D9EAF7" } }, border, alignment: { horizontal: "center", vertical: "center" } };
      for (let c = 0; c < totalCols; c++) {
        const titleCell = XLSX.utils.encode_cell({ r: 0, c });
        const monthCell = XLSX.utils.encode_cell({ r: 1, c });
        const dayCell = XLSX.utils.encode_cell({ r: 2, c });
        const typeCell = XLSX.utils.encode_cell({ r: 3, c });
        if (ws[titleCell]) ws[titleCell].s = titleStyle;
        if (ws[monthCell]) ws[monthCell].s = monthStyle;
        if (ws[dayCell]) ws[dayCell].s = headerStyle;
        if (ws[typeCell]) ws[typeCell].s = subHeaderStyle;
      }
      for (let r = 4; r < sheetData.length; r++) for (let c = 0; c < totalCols; c++) {
        const cell = ws[XLSX.utils.encode_cell({ r, c })];
        if (!cell) continue;
        const day = c >= 3 ? Math.floor((c - 3) / 2) + 1 : null;
        const employee = employees[r - 4];
        const record = day && employee ? lookup[employee.id]?.[`${year}-${pad(month)}-${pad(day)}`] : null;
        const isCheckOut = c >= 3 && (c - 3) % 2 === 1;
        const status = isCheckOut ? record?.check_out_status : record?.check_in_status;
        const isAttendanceMark = c >= 3 && cell.v;
        cell.s = {
          border,
          alignment: { horizontal: c === 1 ? "left" : "center", vertical: "center" },
          font: isAttendanceMark ? { name: "Arial", bold: true, sz: 12, color: { rgb: statusColor(status) } } : { color: { rgb: "1F2937" } },
          fill: { fgColor: { rgb: r % 2 === 0 ? "F8FAFC" : "FFFFFF" } },
        };
      }
      for (let r = legendStartRow; r <= legendStartRow + 1; r++) {
        const cell = ws[XLSX.utils.encode_cell({ r, c: 0 })];
        if (cell) cell.s = { font: { italic: true, sz: 10, color: { rgb: "475569" } }, alignment: { horizontal: "left", vertical: "center", wrapText: true } };
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `Absensi ${monthLabel} ${year}`);
      XLSX.writeFile(wb, `Laporan_Absensi_${monthLabel}_${year}.xlsx`);
    } catch (err) {
      console.error("exportMonthly error:", err);
      alert("Gagal mengekspor laporan.");
    } finally {
      setExportLoading(false);
    }
  };

  const inputClass = "w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none focus:border-blue-500 transition-all";
  const inputStyle = { backgroundColor: "var(--bg-input)", borderColor: "var(--border-strong)", color: "var(--text-primary)" };
  const yearOptions = [];
  for (let y = now.getFullYear() + 10; y >= 2020; y--) yearOptions.push(y);

  // Tampilkan halaman laporan bulanan
  if (showMonthlyReport) {
    return (
      <MonthlyReport
        month={exportMonth}
        year={exportYear}
        token={session?.access_token}
        onClose={() => setShowMonthlyReport(false)}
      />
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Clock className="w-6 h-6 text-blue-500" /><span>Riwayat Absensi</span>
          </h2>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Pilih rentang tanggal, cari nama, lalu export laporan.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setShowExportPanel(v => !v)}
            className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-500 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-emerald-500/30 transition-all">
            <FileDown className="w-4 h-4" /><span>Cetak Laporan Bulanan</span>
          </button>
        </div>
      </div>

      {/* Panel Laporan Bulanan */}
      {showExportPanel && (
        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/20">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Laporan Bulanan
          </h3>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>Bulan</label>
              <select value={exportMonth} onChange={e => setExportMonth(Number(e.target.value))}
                className="px-3 py-2 rounded-xl text-sm border focus:outline-none" style={inputStyle}>
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>Tahun</label>
              <select value={exportYear} onChange={e => setExportYear(Number(e.target.value))}
                className="px-3 py-2 rounded-xl text-sm border focus:outline-none" style={inputStyle}>
                {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button onClick={handleExportMonthly} disabled={exportLoading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center gap-2 transition-all">
              <FileDown className="w-4 h-4" />
              {exportLoading ? "Memproses..." : `Excel ${MONTHS[exportMonth - 1]} ${exportYear}`}
            </button>
            <button onClick={() => setShowMonthlyReport(true)} disabled={exportLoading}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center gap-2 transition-all">
              <Printer className="w-4 h-4" />
              {`PDF ${MONTHS[exportMonth - 1]} ${exportYear}`}
            </button>
          </div>
          <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
            Format: No | Nama | NIP | kolom tanggal 1–{daysInMonth(exportYear, exportMonth)} dengan Masuk & Pulang per hari.
          </p>
        </div>
      )}

      {/* Filter */}
      <div className="glass-panel relative z-20 p-5 rounded-2xl space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--text-muted)" }} />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau NIP..."
              className={`${inputClass} pl-9`} style={inputStyle} />
          </div>
          <button type="submit"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm flex items-center gap-1.5">
            <Search className="w-4 h-4" /><span>Cari</span>
          </button>
        </form>
        <div>
          <p className="text-[11px] uppercase tracking-wider font-semibold mb-2 flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
            <CalendarDays className="w-3.5 h-3.5" /> Pilih Rentang Tanggal
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-full">
              <label className="block text-[10px] mb-1" style={{ color: "var(--text-muted)" }}>Dari Tanggal</label>
              <DatePicker value={startDate} maxDate={endDate || toDateStr(new Date())}
                onChange={(v) => { setStartDate(v); if (endDate && v && v > endDate) setEndDate(""); }}
                placeholder="Pilih tanggal mulai" />
            </div>
            <span className="hidden sm:block mt-4" style={{ color: "var(--text-muted)" }}>s/d</span>
            <div className="w-full">
              <label className="block text-[10px] mb-1" style={{ color: "var(--text-muted)" }}>Sampai Tanggal</label>
              <DatePicker value={endDate} minDate={startDate || undefined} maxDate={toDateStr(new Date())}
                onChange={setEndDate} placeholder="Pilih tanggal akhir" />
            </div>
          </div>
          {(startDate || endDate) && (
            <div className="mt-2.5 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-500 flex items-center gap-2">
              <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
              <span>
                Menampilkan: <strong>{startDate && endDate ? `${startDate} s/d ${endDate}` : startDate ? `Mulai ${startDate}` : `Sampai ${endDate}`}</strong>
                {" "}— <span style={{ color: "var(--text-muted)" }}>{records.length} data</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel relative z-0 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-sm" style={{ color: "var(--text-muted)" }}>Memuat data absensi...</div>
        ) : records.length === 0 ? (
          <div className="text-center py-12 text-sm" style={{ color: "var(--text-muted)" }}>
            <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Tidak ada data absensi yang sesuai filter.</p>
            {(startDate || endDate || search) && (
              <button onClick={() => { setSearch(""); setStartDate(""); setEndDate(""); }}
                className="mt-3 text-xs text-blue-500 hover:underline">Reset filter</button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-[11px] font-semibold uppercase"
                  style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-card)", color: "var(--text-muted)" }}>
                  <th className="py-3 px-4">No</th>
                  <th className="py-3 px-4">Nama</th>
                  <th className="py-3 px-4">NIP</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Jam Masuk</th>
                  <th className="py-3 px-4">Status Masuk</th>
                  <th className="py-3 px-4">Jam Pulang</th>
                  <th className="py-3 px-4">Status Pulang</th>
                  <th className="py-3 px-4">Metode</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                {records.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-black/5 transition-colors">
                    <td className="py-3 px-4 text-xs" style={{ color: "var(--text-muted)" }}>{idx + 1}</td>
                    <td className="py-3 px-4 font-semibold" style={{ color: "var(--text-primary)" }}>{r.employees?.name || "-"}</td>
                    <td className="py-3 px-4 font-mono text-xs" style={{ color: "var(--text-muted)" }}>{r.employees?.employee_number || "-"}</td>
                    <td className="py-3 px-4 font-mono text-xs" style={{ color: "var(--text-secondary)" }}>{r.date}</td>
                    <td className="py-3 px-4 font-mono text-xs" style={{ color: "var(--text-secondary)" }}>
                      {r.check_in ? new Date(r.check_in).toLocaleTimeString("id-ID") : "-"}
                    </td>
                    <td className="py-3 px-4">
                      <span className={badgeCheckIn(r.check_in_status)}>{labelCheckIn(r.check_in_status)}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs" style={{ color: "var(--text-secondary)" }}>
                      {r.check_out ? new Date(r.check_out).toLocaleTimeString("id-ID") : "-"}
                    </td>
                    <td className="py-3 px-4">
                      {r.check_out_status
                        ? <span className={badgeCheckOut(r.check_out_status)}>{labelCheckOut(r.check_out_status)}</span>
                        : <span className="text-xs" style={{ color: "var(--text-muted)" }}>Belum Absen Pulang</span>
                      }
                    </td>
                    <td className="py-3 px-4">
                      {r.manual
                        ? <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-500 border border-orange-500/30">Manual</span>
                        : <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-500 border border-blue-500/30">Kartu</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t" style={{ borderColor: "var(--border)" }}>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Menampilkan <strong style={{ color: "var(--text-primary)" }}>{records.length}</strong> data absensi
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
