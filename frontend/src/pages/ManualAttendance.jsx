import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../lib/api";
import { UserCheck, Search, CheckCircle2, AlertCircle, Clock, LogIn, LogOut } from "lucide-react";

export default function ManualAttendance() {
  const { session } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [filtered,  setFiltered]  = useState([]);
  const [search,    setSearch]    = useState("");
  const [loading,   setLoading]   = useState(true);
  const [processing, setProcessing] = useState(null); // employee id yang sedang diproses
  const requestLock = useRef(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  async function fetchEmployees() {
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/employees`, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      const json = await res.json();
      if (json.data) {
        const active = json.data.filter(e => e.status === "active");
        setEmployees(active);
        setFiltered(active);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { fetchEmployees(); }, [session]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      q ? employees.filter(e =>
        e.name.toLowerCase().includes(q) ||
        (e.employee_number || "").toLowerCase().includes(q)
      ) : employees
    );
  }, [search, employees]);

  async function handleAbsen(employee, type) {
    if (requestLock.current) return;
    requestLock.current = true;
    setProcessing(`${employee.id}-${type}`);
    setMsg({ type: "", text: "" });
    try {
      const res  = await fetch(`${API_URL}/attendance/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ employee_id: employee.id, type })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal absensi manual.");
      setMsg({ type: "success", text: `✅ ${json.message} — ${employee.name}` });
      fetchEmployees();
    } catch (err) {
      setMsg({ type: "error", text: `❌ ${err.message}` });
    }
    setProcessing(null);
    requestLock.current = false;
  }

  const now = new Date();
  const todayStr = now.toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Absensi Manual</h2>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Gunakan saat NFC tidak dapat berfungsi (misal: mati lampu). Tanggal: <strong>{todayStr}</strong>
            </p>
          </div>
          <span className="ml-auto px-3 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-500 border border-orange-500/30">
            Operator
          </span>
        </div>
      </div>

      {/* Notifikasi */}
      {msg.text && (
        <div className={`p-4 rounded-xl text-sm flex items-center gap-2 ${
          msg.type === "success"
            ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-600"
            : "bg-red-500/10 border border-red-500/30 text-red-500"
        }`}>
          {msg.type === "success"
            ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <span>{msg.text}</span>
          <button onClick={() => setMsg({ type: "", text: "" })} className="ml-auto text-xs opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Search */}
      <div className="glass-panel p-4 rounded-2xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama atau NIP karyawan..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:border-orange-500 transition-all"
            style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border-strong)", color: "var(--text-primary)" }}
          />
        </div>
        <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
          {filtered.length} karyawan aktif ditemukan
        </p>
      </div>

      {/* Daftar Karyawan */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-sm" style={{ color: "var(--text-muted)" }}>Memuat data karyawan...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-sm" style={{ color: "var(--text-muted)" }}>Tidak ada karyawan ditemukan.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs font-semibold uppercase"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-card)", color: "var(--text-muted)" }}>
                <th className="py-3 px-4 text-left">No</th>
                <th className="py-3 px-4 text-left">Nama Karyawan</th>
                <th className="py-3 px-4 text-left">NIP</th>
                <th className="py-3 px-4 text-left">Status Kartu</th>
                <th className="py-3 px-4 text-center">Absen Masuk</th>
                <th className="py-3 px-4 text-center">Absen Pulang</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
              {filtered.map((emp, idx) => {
                const isCheckIn  = processing === `${emp.id}-check_in`;
                const isCheckOut = processing === `${emp.id}-check_out`;
                return (
                  <tr key={emp.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 text-xs" style={{ color: "var(--text-muted)" }}>{idx + 1}</td>
                    <td className="py-3.5 px-4 font-semibold" style={{ color: "var(--text-primary)" }}>{emp.name}</td>
                    <td className="py-3.5 px-4 font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                      {emp.employee_number || "-"}
                    </td>
                    <td className="py-3.5 px-4">
                      {emp.nfc_card?.status === "active"
                        ? <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">Kartu Aktif</span>
                        : <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-500 border border-slate-500/30">Tanpa Kartu</span>
                      }
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleAbsen(emp, "check_in")}
                        disabled={!!processing}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-500/10 text-blue-500 border border-blue-500/30 hover:bg-blue-500/20 disabled:opacity-40 transition-all"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        {isCheckIn ? "Memproses..." : "Masuk"}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleAbsen(emp, "check_out")}
                        disabled={!!processing}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-500/10 text-orange-500 border border-orange-500/30 hover:bg-orange-500/20 disabled:opacity-40 transition-all"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        {isCheckOut ? "Memproses..." : "Pulang"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
