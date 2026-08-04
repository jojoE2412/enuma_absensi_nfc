import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { labelCheckIn, labelCheckOut, badgeCheckIn, badgeCheckOut } from "../lib/statusHelpers";
import {
  Users, Clock, CheckCircle2, AlertTriangle, Briefcase,
  CreditCard, ArrowUpRight, TrendingUp
} from "lucide-react";

export default function AdminDashboard({ setCurrentTab }) {
  const { session } = useAuth();
  const [stats, setStats] = useState({
    totalEmployees: 0, totalAbsensiHariIni: 0,
    totalHadir: 0, totalTerlambat: 0, totalLembur: 0
  });
  const [recentRecords, setRecentRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadDashboardData() {
    try {
      setLoading(true);
      const token = session?.access_token;
      const [resStats, resAtt] = await Promise.all([
        fetch("http://localhost:3001/api/dashboard/stats", { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`http://localhost:3001/api/attendance?startDate=${new Date().toLocaleDateString("sv-SE")}&endDate=${new Date().toLocaleDateString("sv-SE")}&limit=20`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const [dataStats, dataAtt] = await Promise.all([resStats.json(), resAtt.json()]);
      if (dataStats.data) setStats(dataStats.data);
      if (dataAtt.data) setRecentRecords(dataAtt.data);
    } catch (err) {
      console.error("loadDashboardData error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadDashboardData(); }, [session]);

  const metricCards = [
    { label: "Total User",        value: stats.totalEmployees,      color: "text-blue-500",   bg: "bg-blue-500/10",   border: "border-blue-500/20",   icon: <Users className="w-6 h-6" /> },
    { label: "Absensi Hari Ini",  value: stats.totalAbsensiHariIni, color: "text-indigo-500", bg: "bg-indigo-500/10", border: "border-indigo-500/20", icon: <Clock className="w-6 h-6" /> },
    { label: "Total Hadir",       value: stats.totalHadir,          color: "text-emerald-500",bg: "bg-emerald-500/10",border: "border-emerald-500/20",icon: <CheckCircle2 className="w-6 h-6" /> },
    { label: "Terlambat",         value: stats.totalTerlambat,      color: "text-amber-500",  bg: "bg-amber-500/10",  border: "border-amber-500/20",  icon: <AlertTriangle className="w-6 h-6" /> },
    { label: "Lembur",            value: stats.totalLembur,         color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20", icon: <Briefcase className="w-6 h-6" /> },
  ];

  return (
    <div className="space-y-8">

      {/* Header Banner */}
      <div className="glass-panel p-6 lg:p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30 mb-3">
              <TrendingUp className="w-3.5 h-3.5" /> Dashboard Utama Admin
            </div>
            <h2 className="text-2xl lg:text-3xl font-extrabold" style={{ color: "var(--text-primary)" }}>
              Selamat Datang di Panel Kontrol Sistem
            </h2>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Kelola data User, registrasi kartu NFC ACS ACR122U, dan pantau absensi harian.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setCurrentTab("nfc")}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all">
              <CreditCard className="w-4 h-4" /><span>Registrasi NFC</span>
            </button>
            <button onClick={() => setCurrentTab("employees")}
              className="px-4 py-2.5 text-xs font-bold rounded-xl border flex items-center gap-2 transition-all"
              style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-secondary)" }}>
              <Users className="w-4 h-4" /><span>Kelola User</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {metricCards.map((m) => (
          <div key={m.label} className="glass-card p-5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{m.label}</p>
              <h3 className={`text-2xl font-black mt-1 ${m.color}`}>{m.value || 0}</h3>
            </div>
            <div className={`w-12 h-12 rounded-2xl ${m.bg} ${m.color} flex items-center justify-center border ${m.border}`}>
              {m.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Absensi Table */}
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Aktivitas Absensi Hari Ini</h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Aktivitas absensi User hari ini</p>
          </div>
          <button onClick={() => setCurrentTab("history")}
            className="text-xs font-semibold text-blue-500 hover:text-blue-400 flex items-center gap-1">
            Lihat Semua <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-sm" style={{ color: "var(--text-muted)" }}>Memuat data absensi...</div>
        ) : recentRecords.length === 0 ? (
          <div className="text-center py-8 text-sm" style={{ color: "var(--text-muted)" }}>Belum ada aktivitas absensi User hari ini.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-[11px] font-semibold uppercase" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                  <th className="py-3 px-4">Nama User</th>
                  <th className="py-3 px-4">NIK</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Check-In</th>
                  <th className="py-3 px-4">Check-Out</th>
                  <th className="py-3 px-4">Status Masuk</th>
                  <th className="py-3 px-4">Status Pulang</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                {recentRecords.map((row) => (
                  <tr key={row.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-semibold" style={{ color: "var(--text-primary)" }}>{row.employees?.name || "User"}</td>
                    <td className="py-3 px-4 font-mono text-xs" style={{ color: "var(--text-muted)" }}>{row.employees?.employee_number || "-"}</td>
                    <td className="py-3 px-4 font-mono text-xs" style={{ color: "var(--text-secondary)" }}>{row.date}</td>
                    <td className="py-3 px-4 font-mono text-xs" style={{ color: "var(--text-secondary)" }}>
                      {row.check_in ? new Date(row.check_in).toLocaleTimeString("id-ID") : "-"}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs" style={{ color: "var(--text-secondary)" }}>
                      {row.check_out ? new Date(row.check_out).toLocaleTimeString("id-ID") : "-"}
                    </td>
                    <td className="py-3 px-4">
                      <span className={badgeCheckIn(row.check_in_status)}>{labelCheckIn(row.check_in_status)}</span>
                    </td>
                    <td className="py-3 px-4">
                      {row.check_out_status
                        ? <span className={badgeCheckOut(row.check_out_status)}>{labelCheckOut(row.check_out_status)}</span>
                        : <span className="text-xs" style={{ color: "var(--text-muted)" }}>Belum Absen Pulang</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
