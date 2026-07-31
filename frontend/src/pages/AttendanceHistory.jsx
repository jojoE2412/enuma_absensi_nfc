import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import DatePicker from "../components/DatePicker";
import { labelCheckIn, labelCheckOut, badgeCheckIn, badgeCheckOut } from "../lib/statusHelpers";
import * as XLSX from "xlsx";
import { Clock, Search, CalendarDays, FileSpreadsheet, Printer } from "lucide-react";

function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function AttendanceHistory() {
  const { session } = useAuth();
  const [records,   setRecords]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate,   setEndDate]   = useState("");

  async function fetchHistory(overrideSearch) {
    try {
      setLoading(true);
      const q = overrideSearch !== undefined ? overrideSearch : search;
      let url = `http://localhost:3001/api/attendance?search=${encodeURIComponent(q)}&limit=200`;
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

  const handleExportExcel = () => {
    if (records.length === 0) { alert("Tidak ada data untuk diekspor."); return; }
    const periodLabel =
      startDate && endDate ? `${startDate} s/d ${endDate}`
      : startDate ? `Mulai ${startDate}`
      : endDate   ? `Sampai ${endDate}`
      : "Semua Tanggal";

    const sheetData = [
      ["LAPORAN ABSENSI USER — SISTEM NFC ACS ACR122U"],
      [`Periode : ${periodLabel}`],
      [`Dicetak : ${new Date().toLocaleString("id-ID")}`],
      [],
      ["No", "Nama User", "NIP / Nomor User", "Tanggal", "Jam Masuk", "Status Masuk", "Jam Pulang", "Status Pulang"],
      ...records.map((r, i) => [
        i + 1,
        r.employees?.name            || "-",
        r.employees?.employee_number || "-",
        r.date                       || "-",
        r.check_in  ? new Date(r.check_in).toLocaleTimeString("id-ID")  : "-",
        labelCheckIn(r.check_in_status),
        r.check_out ? new Date(r.check_out).toLocaleTimeString("id-ID") : "-",
        labelCheckOut(r.check_out_status),
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    ws["!cols"] = [{ wch: 4 }, { wch: 24 }, { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 12 }, { wch: 18 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Absensi User");
    XLSX.writeFile(wb, `Laporan_Absensi_NFC_${toDateStr(new Date())}.xlsx`);
  };

  const inputClass = "w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none focus:border-blue-500 transition-all";
  const inputStyle = { backgroundColor: "var(--bg-input)", borderColor: "var(--border-strong)", color: "var(--text-primary)" };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="print:hidden glass-panel p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Clock className="w-6 h-6 text-blue-500" /><span>Riwayat Absensi User</span>
          </h2>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Pilih rentang tanggal, cari nama User, lalu export.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleExportExcel}
            className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-500 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-emerald-500/30 transition-all">
            <FileSpreadsheet className="w-4 h-4" /><span>Export Excel (.xlsx)</span>
          </button>
          <button onClick={() => window.print()}
            className="px-3.5 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-500 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-purple-500/30 transition-all">
            <Printer className="w-4 h-4" /><span>Cetak / PDF</span>
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="print:hidden glass-panel relative z-20 p-5 rounded-2xl space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--text-muted)" }} />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama User atau NIP..."
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

      {/* Print Header */}
      <div className="hidden print:block mb-4">
        <h1 className="text-xl font-bold text-black">LAPORAN ABSENSI USER</h1>
        <p className="text-sm text-gray-600 mt-1">Sistem Absensi Berbasis NFC — ACS ACR122U</p>
        {(startDate || endDate) && (
          <p className="text-sm text-gray-600">Periode: {startDate && endDate ? `${startDate} s/d ${endDate}` : startDate ? `Mulai ${startDate}` : `Sampai ${endDate}`}</p>
        )}
        <p className="text-xs text-gray-500 mt-0.5">Dicetak: {new Date().toLocaleString("id-ID")}</p>
        <hr className="my-3 border-gray-300" />
      </div>

      {/* Table */}
      <div className="glass-panel relative z-0 rounded-2xl print:border-0 print:rounded-none overflow-hidden">
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
            <table className="w-full text-left text-sm print:text-black print:text-xs">
              <thead>
                <tr className="border-b text-[11px] font-semibold uppercase print:border-gray-400"
                  style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-card)", color: "var(--text-muted)" }}>
                  <th className="py-3 px-4 print:px-2">No</th>
                  <th className="py-3 px-4 print:px-2">Nama User</th>
                  <th className="py-3 px-4 print:px-2">NIP</th>
                  <th className="py-3 px-4 print:px-2">Tanggal</th>
                  <th className="py-3 px-4 print:px-2">Jam Masuk</th>
                  <th className="py-3 px-4 print:px-2">Status Masuk</th>
                  <th className="py-3 px-4 print:px-2">Jam Pulang</th>
                  <th className="py-3 px-4 print:px-2">Status Pulang</th>
                </tr>
              </thead>
              <tbody className="divide-y print:divide-gray-300" style={{ borderColor: "var(--border)" }}>
                {records.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-black/5 transition-colors print:hover:bg-transparent">
                    <td className="py-3 px-4 print:px-2 text-xs" style={{ color: "var(--text-muted)" }}>{idx + 1}</td>
                    <td className="py-3 px-4 print:px-2 font-semibold print:text-black" style={{ color: "var(--text-primary)" }}>{r.employees?.name || "User"}</td>
                    <td className="py-3 px-4 print:px-2 font-mono text-xs print:text-gray-600" style={{ color: "var(--text-muted)" }}>{r.employees?.employee_number || "-"}</td>
                    <td className="py-3 px-4 print:px-2 font-mono text-xs print:text-black" style={{ color: "var(--text-secondary)" }}>{r.date}</td>
                    <td className="py-3 px-4 print:px-2 font-mono text-xs print:text-black" style={{ color: "var(--text-secondary)" }}>
                      {r.check_in ? new Date(r.check_in).toLocaleTimeString("id-ID") : "-"}
                    </td>
                    <td className="py-3 px-4 print:px-2">
                      <span className={`${badgeCheckIn(r.check_in_status)} print:bg-transparent print:border-0 print:p-0`}>
                        {labelCheckIn(r.check_in_status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 print:px-2 font-mono text-xs print:text-black" style={{ color: "var(--text-secondary)" }}>
                      {r.check_out ? new Date(r.check_out).toLocaleTimeString("id-ID") : "-"}
                    </td>
                    <td className="py-3 px-4 print:px-2">
                      {r.check_out_status
                        ? <span className={`${badgeCheckOut(r.check_out_status)} print:bg-transparent print:border-0 print:p-0`}>{labelCheckOut(r.check_out_status)}</span>
                        : <span className="text-xs print:text-gray-400" style={{ color: "var(--text-muted)" }}>Belum Absen Pulang</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t flex items-center justify-between print:border-gray-300"
              style={{ borderColor: "var(--border)" }}>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Menampilkan <strong style={{ color: "var(--text-primary)" }}>{records.length}</strong> data absensi
              </p>
              <p className="hidden print:block text-xs text-gray-500">Dokumen ini digenerate otomatis oleh Sistem Absensi NFC</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
