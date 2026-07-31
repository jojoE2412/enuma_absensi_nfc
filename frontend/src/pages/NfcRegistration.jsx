import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  CreditCard, Radio, CheckCircle2, AlertCircle,
  UserCheck, Zap, Wifi, WifiOff, Info
} from "lucide-react";

export default function NfcRegistration() {
  const { session } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [cards, setCards] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [scannedUid, setScannedUid] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [backendConnected, setBackendConnected] = useState(false);
  const [readerStatus, setReaderStatus] = useState({ status: "waiting", message: "Menunggu status reader NFC." });
  const readerReady = readerStatus.status === "active";

  async function loadData() {
    try {
      setLoading(true);
      const token = session?.access_token;
      const [resEmp, resCards] = await Promise.all([
        fetch("http://localhost:3001/api/employees", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:3001/api/nfc/cards",  { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const [dataEmp, dataCards] = await Promise.all([resEmp.json(), resCards.json()]);
      if (dataEmp.data) setEmployees(dataEmp.data.filter(e => !e.nfc_card || e.nfc_card.status !== "active"));
      if (dataCards.data) setCards(dataCards.data);
    } catch {
      setErrorMsg("Gagal memuat data dari server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    let sse, retryTimeout;
    function connectSSE() {
      sse = new EventSource("http://localhost:3001/api/nfc/stream");
      sse.addEventListener("connected", (e) => {
        setBackendConnected(true);
        try { const d = JSON.parse(e.data); if (d.readerStatus) setReaderStatus(d.readerStatus); } catch {}
      });
      sse.addEventListener("reader_status", (e) => {
        try { const d = JSON.parse(e.data); setReaderStatus(d); } catch {}
      });
      sse.addEventListener("nfc_tap", (e) => {
        try {
          const d = JSON.parse(e.data);
          if (d.uid) { setScannedUid(d.uid); setSuccessMsg(`✅ Kartu NFC terbaca! UID: ${d.uid}`); setErrorMsg(""); }
        } catch {}
      });
      sse.onerror = () => {
        setBackendConnected(false); sse.close();
        retryTimeout = setTimeout(connectSSE, 3000);
      };
    }
    connectSSE();
    return () => { if (sse) sse.close(); if (retryTimeout) clearTimeout(retryTimeout); };
  }, [session]);

  const handleRegisterCard = async (e) => {
    e.preventDefault(); setErrorMsg(""); setSuccessMsg("");
    if (!selectedEmployeeId || !scannedUid) { setErrorMsg("Pilih User dan pastikan UID kartu terisi."); return; }
    try {
      const res = await fetch("http://localhost:3001/api/nfc/register", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ employee_id: selectedEmployeeId, uid: scannedUid })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal mendaftarkan kartu.");
      setSuccessMsg(`✅ Kartu NFC (${scannedUid}) berhasil dihubungkan ke User!`);
      setScannedUid(""); setSelectedEmployeeId(""); loadData();
    } catch (err) { setErrorMsg(err.message); }
  };

  const handleToggleStatus = async (cardId, currentStatus) => {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      const res = await fetch(`http://localhost:3001/api/nfc/cards/${cardId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ status: newStatus })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal mengubah status kartu.");
      setSuccessMsg(`Status kartu berhasil diubah menjadi ${newStatus}.`); loadData();
    } catch (err) { setErrorMsg(err.message); }
  };

  const simulateTap = async () => {
    const testUid = "04" + Math.floor(Math.random() * 0xFFFFFFFF).toString(16).toUpperCase().padStart(8, "0");
    try {
      await fetch("http://localhost:3001/api/nfc/tap", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: testUid })
      });
      setSuccessMsg(`🧪 Simulasi tap dengan UID: ${testUid}`);
    } catch { setScannedUid(testUid); }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <CreditCard className="w-6 h-6 text-purple-500" /><span>Registrasi Kartu NFC User</span>
          </h2>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Hubungkan UID kartu NFC (ACS ACR122U) dengan data User.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold ${
            backendConnected ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" : "bg-red-500/10 border-red-500/30 text-red-500"
          }`}>
            {backendConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            <span>{backendConnected ? "Backend Terhubung" : "Backend Terputus"}</span>
          </div>
          <button onClick={simulateTap}
            className="px-3 py-2 text-xs font-bold rounded-xl border flex items-center gap-1.5 transition-all"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-secondary)" }}>
            <Zap className="w-4 h-4 text-amber-500" /><span>Uji Scan</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" /><span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" /><span>{successMsg}</span>
        </div>
      )}
      {backendConnected && !readerReady && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{readerStatus.message || "Reader NFC belum siap. Periksa sambungan ACS ACR122U."}</span>
        </div>
      )}

      {/* Form + Reader */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Form */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-bold mb-5 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <UserCheck className="w-5 h-5 text-blue-500" /><span>Form Pairing Kartu ke User</span>
          </h3>
          <form onSubmit={handleRegisterCard} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-secondary)" }}>
                1. Pilih User Target *
              </label>
              <select value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)} required
                className="w-full px-4 py-3 rounded-xl text-sm border focus:outline-none focus:border-blue-500"
                style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border-strong)", color: "var(--text-primary)" }}>
                <option value="">-- Pilih User --</option>
                {employees.length === 0 && <option value="" disabled>Semua User sudah memiliki kartu aktif</option>}
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} {emp.employee_number ? `(${emp.employee_number})` : ""} — Belum Ada Kartu
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-secondary)" }}>
                2. UID Kartu NFC (Otomatis Terisi saat Kartu Ditap) *
              </label>
              <div className="relative">
                <input type="text" value={scannedUid}
                  onChange={(e) => setScannedUid(e.target.value.toUpperCase().replace(/[^A-F0-9]/g, ""))}
                  placeholder={readerReady ? "Tempelkan kartu NFC ke ACS ACR122U..." : "Reader NFC belum siap..."}
                  required
                  className={`w-full px-4 py-4 rounded-xl border-2 font-mono font-bold text-xl tracking-widest focus:outline-none transition-all ${
                    scannedUid ? "border-emerald-500/60" : readerReady ? "border-blue-500/50 animate-pulse" : "border-slate-400/30"
                  }`}
                  style={{ backgroundColor: "var(--bg-input)", color: scannedUid ? "#10b981" : readerReady ? "#6366f1" : "var(--text-muted)" }} />
                {scannedUid && (
                  <button type="button" onClick={() => setScannedUid("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold"
                    style={{ color: "var(--text-muted)" }}>✕ Clear</button>
                )}
              </div>
              <p className="text-xs mt-2 flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                <Info className="w-3.5 h-3.5" />
                UID terisi otomatis saat kartu NFC ditap pada ACS ACR122U (Jalankan <code className="text-amber-500">backend/start_nfc_listener.bat</code>).
              </p>
            </div>

            <button type="submit" disabled={!scannedUid || !selectedEmployeeId}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 text-sm flex items-center justify-center gap-2 transition-all">
              <CreditCard className="w-5 h-5" /><span>SIMPAN & HUBUNGKAN KARTU</span>
            </button>
          </form>
        </div>

        {/* Reader Status */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between text-center relative overflow-hidden">
          <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl ${readerReady ? "bg-emerald-500/10" : "bg-red-500/10"}`} />
          <div>
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl border mb-4 ${
              readerReady ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/30 glow-emerald" : "bg-red-500/10 text-red-500 border-red-500/20"
            }`}>
              <Radio className={`w-8 h-8 ${readerReady ? "animate-pulse" : ""}`} />
            </div>
            <h4 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>ACS ACR122U</h4>
            <p className={`text-xs mt-1 font-semibold ${readerReady ? "text-emerald-500" : "text-red-500"}`}>
              {readerReady ? "● READER SIAP SCAN" : "○ READER TIDAK TERDETEKSI"}
            </p>
            <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>{readerStatus.message}</p>
          </div>

          <div className="my-5 p-4 rounded-xl border text-center" style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border)" }}>
            <p className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: "var(--text-muted)" }}>UID Terbaca</p>
            <p className={`text-base font-mono font-extrabold tracking-wider break-all ${scannedUid ? "text-emerald-500" : ""}`}
              style={!scannedUid ? { color: "var(--text-muted)" } : {}}>
              {scannedUid || "BELUM ADA TAP"}
            </p>
          </div>

          <div className="text-[11px] space-y-1.5">
            <p className="font-semibold" style={{ color: "var(--text-secondary)" }}>Cara Menjalankan Listener:</p>
            <div className="rounded-lg p-2.5 text-left font-mono text-[10px] text-amber-500 border"
              style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border)" }}>
              backend/<span style={{ color: "var(--text-primary)" }}>start_nfc_listener.bat</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cards Table */}
      <div className="glass-panel p-6 rounded-2xl">
        <h3 className="text-lg font-bold mb-4" style={{ color: "var(--text-primary)" }}>Daftar Kartu NFC Terdaftar</h3>
        {loading ? (
          <div className="text-center py-8 text-sm" style={{ color: "var(--text-muted)" }}>Memuat data kartu...</div>
        ) : cards.length === 0 ? (
          <div className="text-center py-8 text-sm" style={{ color: "var(--text-muted)" }}>Belum ada kartu NFC yang terdaftar.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs font-semibold uppercase" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                  <th className="py-3 px-4">UID Kartu</th>
                  <th className="py-3 px-4">Nama User</th>
                  <th className="py-3 px-4">NIP / Nomor User</th>
                  <th className="py-3 px-4">Status Kartu</th>
                  <th className="py-3 px-4">Tanggal Registrasi</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                {cards.map((c) => (
                  <tr key={c.id} className="hover:bg-black/5 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-500">{c.uid}</td>
                    <td className="py-3.5 px-4 font-semibold" style={{ color: "var(--text-primary)" }}>{c.employees?.name || "Belum Terhubung"}</td>
                    <td className="py-3.5 px-4 font-mono text-xs" style={{ color: "var(--text-muted)" }}>{c.employees?.employee_number || "-"}</td>
                    <td className="py-3.5 px-4">
                      {c.status === "active"
                        ? <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">Aktif</span>
                        : <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-500 border border-red-500/30">Nonaktif</span>
                      }
                    </td>
                    <td className="py-3.5 px-4 text-xs" style={{ color: "var(--text-muted)" }}>
                      {new Date(c.created_at).toLocaleDateString("id-ID")}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button onClick={() => handleToggleStatus(c.id, c.status)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                          c.status === "active"
                            ? "bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/20"
                            : "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20"
                        }`}>
                        {c.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                      </button>
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
