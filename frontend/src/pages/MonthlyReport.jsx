import { useEffect, useState } from "react";
import { Printer } from "lucide-react";

const MONTHS = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember"
];

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

const pad = (n) => String(n).padStart(2, "0");

const statusColor = (status) => ({ on_time: "#15803d", late: "#ca8a04", early_leave: "#ea580c", normal: "#2563eb", overtime: "#7c3aed" }[status] || "#1f2937");
const attendanceSymbol = (record) => record?.manual ? "☑" : "✓";

export default function MonthlyReport({ month, year, token, onClose }) {
  const [employees, setEmployees] = useState([]);
  const [lookup,    setLookup]    = useState({});
  const [totalDays, setTotalDays] = useState(0);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    async function load() {
      const m = month;
      const y = year;
      const days = daysInMonth(y, m);
      setTotalDays(days);
      const startStr = `${y}-${pad(m)}-01`;
      const endStr   = `${y}-${pad(m)}-${pad(days)}`;
      try {
        const res  = await fetch(
          `http://localhost:3001/api/attendance?startDate=${startStr}&endDate=${endStr}&limit=1000`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const json = await res.json();
        const data = json.data || [];

        const empMap = new Map();
        for (const r of data) {
          if (r.employees?.id && !empMap.has(r.employees.id))
            empMap.set(r.employees.id, { id: r.employees.id, name: r.employees.name || "-", nip: r.employees.employee_number || "-" });
        }
        const emps = [...empMap.values()].sort((a, b) => a.name.localeCompare(b.name));

        const lk = {};
        for (const r of data) {
          if (!r.employees?.id) continue;
          if (!lk[r.employees.id]) lk[r.employees.id] = {};
          lk[r.employees.id][r.date] = r;
        }
        setEmployees(emps);
        setLookup(lk);
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, [month, year, token]);

  const monthLabel = MONTHS[month - 1];

  const th = {
    border: "1px solid #666",
    padding: "4px 3px",
    textAlign: "center",
    backgroundColor: "#e8e8e8",
    fontWeight: "bold",
    fontSize: "8px",
    whiteSpace: "nowrap",
  };
  const td = {
    border: "1px solid #aaa",
    padding: "3px 2px",
    textAlign: "center",
    fontSize: "8px",
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "16px", backgroundColor: "#fff", color: "#000" }}>

      {/* Toolbar — tidak ikut print */}
      <div className="print:hidden flex items-center gap-3 mb-4 p-3 bg-gray-100 rounded-xl">
        <button onClick={onClose}
          className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-300 bg-white hover:bg-gray-50">
          ← Kembali
        </button>
        <span className="text-sm font-semibold text-gray-700">
          Laporan Absensi — {monthLabel} {year}
        </span>
        <button onClick={() => window.print()}
          className="ml-auto flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg">
          <Printer className="w-4 h-4" /> Cetak / Simpan PDF
        </button>
      </div>

      {/* Konten laporan */}
      <div style={{ maxWidth: "100%" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "12px" }}>
          <div style={{ fontSize: "10px", color: "#555" }}>ABSENSI ENUMA TECHNOLOGY</div>
          <div style={{ fontSize: "16px", fontWeight: "bold", marginTop: "2px" }}>LAPORAN ABSENSI BULANAN</div>
          <div style={{ fontSize: "11px", marginTop: "4px" }}>Bulan: <strong>{monthLabel} {year}</strong></div>
          <div style={{ fontSize: "9px", color: "#777", marginTop: "2px" }}>
            Dicetak: {new Date().toLocaleString("id-ID")}
          </div>
        </div>

        {loading ? (
          <p style={{ textAlign: "center", fontSize: "12px", color: "#888" }}>Memuat data...</p>
        ) : employees.length === 0 ? (
          <p style={{ textAlign: "center", fontSize: "12px", color: "#888" }}>Tidak ada data absensi pada bulan ini.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", tableLayout: "auto" }}>
              <thead>
                <tr>
                  <th style={{ ...th, minWidth: "24px" }} rowSpan={2}>No</th>
                  <th style={{ ...th, minWidth: "120px", textAlign: "left", paddingLeft: "6px" }} rowSpan={2}>Nama Karyawan</th>
                  <th style={{ ...th, minWidth: "60px" }} rowSpan={2}>NIP</th>
                  {Array.from({ length: totalDays }, (_, i) => (
                    <th key={i} style={{ ...th, minWidth: "18px", padding: "3px 1px" }} colSpan={2}>{i + 1}</th>
                  ))}
                </tr>
                <tr>
                  {Array.from({ length: totalDays }, (_, i) => (
                    <>
                      <th key={`m${i}`} style={{ ...th, fontSize: "7px", backgroundColor: "#d4e8d4", padding: "2px 1px" }}>M</th>
                      <th key={`p${i}`} style={{ ...th, fontSize: "7px", backgroundColor: "#d4d4e8", padding: "2px 1px" }}>P</th>
                    </>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map((emp, idx) => (
                  <tr key={emp.id} style={{ backgroundColor: idx % 2 === 0 ? "#fff" : "#f9f9f9" }}>
                    <td style={td}>{idx + 1}</td>
                    <td style={{ ...td, textAlign: "left", paddingLeft: "6px", fontWeight: "500" }}>{emp.name}</td>
                    <td style={{ ...td, fontFamily: "monospace", fontSize: "7px" }}>{emp.nip}</td>
                    {Array.from({ length: totalDays }, (_, d) => {
                      const dateStr = `${year}-${pad(month)}-${pad(d + 1)}`;
                      const rec = lookup[emp.id]?.[dateStr];
                      const hasMasuk  = !!rec?.check_in;
                      const hasPulang = !!rec?.check_out;
                      const checkInColor = statusColor(rec?.check_in_status);
                      const checkOutColor = statusColor(rec?.check_out_status);
                      return (
                        <>
                          <td key={`m${d}`} style={{ ...td, fontSize: "10px", fontWeight: hasMasuk ? "bold" : "normal", padding: "2px 1px", color: hasMasuk ? checkInColor : "#ddd" }}>
                            {hasMasuk ? attendanceSymbol(rec) : ""}
                          </td>
                          <td key={`p${d}`} style={{ ...td, fontSize: "10px", fontWeight: hasPulang ? "bold" : "normal", padding: "2px 1px", color: hasPulang ? checkOutColor : "#ddd" }}>
                            {hasPulang ? attendanceSymbol(rec) : ""}
                          </td>
                        </>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Keterangan */}
        <div style={{ marginTop: "12px", fontSize: "9px", color: "#555" }}>
          <p>Keterangan: kolom M = masuk dan kolom P = pulang.</p>
          <p><strong>☑</strong> menandakan absensi manual; <strong>✓</strong> menandakan absensi dengan kartu.</p>
          <p>Warna status: <span style={{ color: "#15803d", fontWeight: "bold" }}>hijau</span> = tepat waktu, <span style={{ color: "#ca8a04", fontWeight: "bold" }}>kuning</span> = terlambat, <span style={{ color: "#ea580c", fontWeight: "bold" }}>oranye</span> = mendahului pulang, <span style={{ color: "#2563eb", fontWeight: "bold" }}>biru</span> = pulang normal, <span style={{ color: "#7c3aed", fontWeight: "bold" }}>ungu</span> = lembur.</p>
          <p>Kolom kosong = tidak hadir / belum ada data.</p>
        </div>
      </div>

      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          @page { size: landscape; margin: 8mm; }
          body { margin: 0; }
        }
      `}</style>
    </div>
  );
}
