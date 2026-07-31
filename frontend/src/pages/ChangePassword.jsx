import { useState } from "react";
import { supabase } from "../lib/supabase";
import { Key, CheckCircle2, AlertCircle } from "lucide-react";

export default function ChangePassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setErrorMsg(""); setSuccessMsg("");
    if (password.length < 6) { setErrorMsg("Password minimal 6 karakter."); return; }
    if (password !== confirmPassword) { setErrorMsg("Konfirmasi password tidak cocok."); return; }
    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccessMsg("Password akun Anda berhasil diperbarui!");
      setPassword(""); setConfirmPassword("");
    } catch (err) {
      setErrorMsg(err.message || "Gagal mengubah password.");
    } finally { setLoading(false); }
  };

  const inputClass = "w-full px-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:border-blue-500 transition-all";
  const inputStyle = { backgroundColor: "var(--bg-input)", borderColor: "var(--border-strong)", color: "var(--text-primary)" };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="glass-panel p-6 rounded-3xl text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-500 border border-blue-500/30 mb-3 glow-blue">
          <Key className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Ubah Password Akun</h2>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Perbarui kata sandi demi keamanan akun Anda.</p>
      </div>

      <div className="glass-panel p-6 rounded-2xl">
        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /><span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" /><span>{successMsg}</span>
          </div>
        )}
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-secondary)" }}>Password Baru</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              required placeholder="Minimal 6 karakter" className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-secondary)" }}>Konfirmasi Password Baru</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              required placeholder="Ketik ulang password baru" className={inputClass} style={inputStyle} />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50">
            {loading ? "Memproses..." : "SIMPAN PASSWORD BARU"}
          </button>
        </form>
      </div>
    </div>
  );
}
