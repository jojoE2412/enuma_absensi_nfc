import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { labelCheckIn, labelCheckOut, badgeCheckIn, badgeCheckOut } from "../lib/statusHelpers";
import {
  Radio, Clock, CheckCircle2, AlertCircle, AlertTriangle,
  Volume2, Sparkles
} from "lucide-react";

export default function OperatorDashboard() {
  const { session } = useAuth();
  const [liveLogs, setLiveLogs] = useState([]);
  const [stats, setStats] = useState({ totalAbsensiHariIni: 0, totalHadir: 0, totalTerlambat: 0, totalLembur: 0 });
  const [latestTapToast, setLatestTapToast] = useState(null);
  const [readerStatus, setReaderStatus] = useState({ status: "waiting", message: "Menunggu status reader NFC." });
  const readerReady = readerStatus.status === "active";

  async function fetchStats() {
    try {
      const res = await fetch("http://localhost:3001/api/dashboard/stats", {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      const json = await res.json();
      if (json.data) setStats(json.data);
    } catch (err) { console.error("fetchStats error:", err); }
  }

  async function fetchTodayLogs() {
    try {
      const today = new Date().toLocaleDateString("sv-SE");
      const res = await fetch(`http://localhost:3001/api/attendance?startDate=${today}&endDate=${today}&limit=100`, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      const json = await res.json();
      if (json.data) setLiveLogs(json.data);
    } catch (err) { console.error("fetchTodayLogs error:", err); }
  }

  useEffect(() => {
    fetchStats();
    fetchTodayLogs();

    const sse = new EventSource("http://localhost:3001/api/nfc/stream");

    sse.addEventListener("connected", (e) => {
      try { const d = JSON.parse(e.data); if (d.readerStatus) setReaderStatus(d.readerStatus); } catch {}
    });
    sse.addEventListener("reader_status", (e) => {
      try {
        const d = JSON.parse(e.data);
        setReaderStatus(d);
        if (d.status !== "active") {
          setLatestTapToast({ type: "error", title: d.message || "Reader NFC tidak siap.", employeeName: "Sistem", time: new Date().toLocaleTimeString("id-ID") });
        }
      } catch {}
    });
    sse.addEventListener("attendance_success", (e) => {
      const p = JSON.parse(e.data);
      setLatestTapToast({ type: "success", title: p.message, employeeName: p.employeeName, time: p.time });
      fetchStats(); fetchTodayLogs();
    });
    sse.addEventListener("attendance_failed", (e) => {
      const p = JSON.parse(e.data);
      setLatestTapToast({ type: "error", title: p.error, employeeName: p.employeeName || "Kartu Tidak Terdaftar", time: new Date().toLocaleTimeString("id-ID") });
    });
    sse.addEventListener("double_tap", (e) => {
      const p = JSON.parse(e.data);
      setLatestTapToast({ type: "double_tap", title: p.error, employeeName: p.employeeName, time: p.time, sisaMenit: p.sisaMenit });
    });

    const channel = supabase
      .channel("realtime-attendance-operator")
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance" }, () => {
        fetchStats(); fetchTodayLogs();
      })
      .subscribe();

    return () => { sse.close(); supabase.removeChannel(channel); };
  }, [session]);

  const toastStyle = {
    success:    { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-500", icon: <CheckCircle2 className="w-6 h-6 flex-shrink-0 text-emerald-500" /> },
    double_tap: { bg: "bg-amber-500/10",   border: "border-amber-500/30",   text: "text-amber-500",   icon: <AlertTriangle className="w-6 h-6 flex-shrink-0 text-amber-500" /> },
    error:      { bg: "bg-red-500/10",     border: "border-red-500/30",     text: "text-red-500",     icon: <AlertCircle className="w-6 h-6 flex-shrink-0 text-red-500" /> },
  };

  const metricCards = [
    { label: "Absensi Hari Ini", value: stats.totalAbsensiHariIni, color: "text-blue-500",    bg: "bg-blue-500/10",    icon: <Clock className="w-5 h-5" /> },
    { label: "Total Hadir",      value: stats.totalHadir,          color: "text-emerald-500", bg: "bg-emerald-500/10", icon: <Sparkles className="w-5 h-5" /> },
    { label: "Terlambat",        value: stats.totalTerlambat,      color: "text-amber-500",   bg: "bg-amber-500/10",   icon: <Volume2 className="w-5 h-5" /> },
    { label: "Lembur",           value: stats.totalLembur,         color: "text-purple-500",  bg: "bg-purple-500/10",  icon: <Sparkles className="w-5 h-5" /> },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-500 border border-teal-500/30 mb-2">
            <Radio className="w-3.5 h-3.5 animate-pulse" /> Monitoring Realtime Operator
          </div>
          <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Pantauan Absensi User (ACS ACR122U)</h2>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Data absensi diperbarui secara otomatis tanpa perlu refresh manual.</p>
        </div>
        <div className={`flex items-center space-x-3 px-4 py-2.5 rounded-2xl border ${readerReady ? "border-teal-500/30" : "border-red-500/30"}`}
          style={{ backgroundColor: "var(--bg-card)" }}>
          <span className="relative flex h-3 w-3">
            {readerReady && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${readerReady ? "bg-teal-500" : "bg-red-500"}`} />
          </span>
          <span className={`text-xs font-bold uppercase tracking-wider ${readerReady ? "text-teal-500" : "text-red-500"}`}>
            {readerReady ? "READER SIAP SCAN" : "READER TIDAK TERDETEKSI"}
          </span>
        </div>
      </div>

      {/* Toast */}
      {latestTapToast && (() => {
        const s = toastStyle[latestTapToast.type] || toastStyle.error;
        return (
          <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-xl ${s.bg} ${s.border} ${s.text}`}>
            <div className="flex items-center space-x-3">
              {s.icon}
              <div>
                <p className="text-sm font-bold">{latestTapToast.title}</p>
                <p className="text-xs opacity-80 mt-0.5">
                  User: <strong style={{ color: "var(--text-primary)" }}>{latestTapToast.employeeName}</strong>
                  {latestTapToast.sisaMenit && (
                    <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono text-[11px]">
                      ⏱ Sisa cooldown: {latestTapToast.sisaMenit} menit
                    </span>
                  )}
                  {" "}— Waktu: {latestTapToast.time}
                </p>
              </div>
            </div>
            <button onClick={() => setLatestTapToast(null)}
              className="text-xs opacity-70 hover:opacity-100 font-bold px-2 py-1 rounded-lg"
              style={{ backgroundColor: "var(--bg-card)" }}>
              Tutup
            </button>
          </div>
        );
      })()}

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {metricCards.map((m) => (
          <div key={m.label} className="glass-card p-5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>{m.label}</p>
              <h3 className={`text-2xl font-black mt-1 ${m.color}`}>{m.value || 0}</h3>
            </div>
            <div className={`w-10 h-10 rounded-xl ${m.bg} ${m.color} flex items-center justify-center`}>{m.icon}</div>
          </div>
        ))}
      </div>

      {/* Live Table */}
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            Log Absensi Realtime
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-500 font-medium">Auto-Sync</span>
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-xs font-semibold uppercase" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                <th className="py-3 px-4">Nama User</th>
                <th className="py-3 px-4">NIK</th>
                <th className="py-3 px-4">Jam Check-In</th>
                <th className="py-3 px-4">Status Check-In</th>
                <th className="py-3 px-4">Jam Check-Out</th>
                <th className="py-3 px-4">Status Check-Out</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
              {liveLogs.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-8 text-sm" style={{ color: "var(--text-muted)" }}>Belum ada data absensi User hari ini.</td></tr>
              ) : liveLogs.map((row) => (
                <tr key={row.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-4 font-semibold" style={{ color: "var(--text-primary)" }}>{row.employees?.name || "User"}</td>
                  <td className="py-3.5 px-4 font-mono text-xs" style={{ color: "var(--text-muted)" }}>{row.employees?.employee_number || "-"}</td>
                  <td className="py-3.5 px-4 font-mono text-xs" style={{ color: "var(--text-secondary)" }}>
                    {row.check_in ? new Date(row.check_in).toLocaleTimeString("id-ID") : "-"}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={badgeCheckIn(row.check_in_status)}>{labelCheckIn(row.check_in_status)}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs" style={{ color: "var(--text-secondary)" }}>
                    {row.check_out ? new Date(row.check_out).toLocaleTimeString("id-ID") : "-"}
                  </td>
                  <td className="py-3.5 px-4">
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
      </div>
    </div>
  );
}
