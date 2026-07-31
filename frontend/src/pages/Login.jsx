import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Radio, Lock, Mail, AlertCircle, ArrowRight } from "lucide-react";

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    try {
      if (!email || !password) throw new Error("Email dan Password wajib diisi.");
      await signIn(email, password);
    } catch (err) {
      let message = err.message || "Gagal melakukan login.";
      if (message.includes("Invalid login credentials")) {
        message = "Email atau password yang Anda masukkan salah.";
      }
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-200"
      style={{ backgroundColor: "var(--bg-page)" }}>
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-xl glow-blue mb-4">
            <Radio className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
            SISTEM ABSENSI BERBASIS NFC
          </h1>
          <p className="text-sm mt-1 font-medium" style={{ color: "var(--text-muted)" }}>
            Portal Access — Admin & Operator
          </p>
        </div>

        <div className="glass-panel p-8 rounded-2xl shadow-2xl">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start space-x-3 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-secondary)" }}>
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none" style={{ color: "var(--text-muted)" }}>
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@absensinfc.com" required
                  className="w-full pl-11 pr-4 py-3 rounded-xl text-sm border focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border-strong)", color: "var(--text-primary)" }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-secondary)" }}>
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none" style={{ color: "var(--text-muted)" }}>
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  className="w-full pl-11 pr-4 py-3 rounded-xl text-sm border focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border-strong)", color: "var(--text-primary)" }}
                />
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><span>MASUK SISTEM</span><ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </form>

          <div className="mt-8 pt-6 border-t text-xs" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
            <p className="font-semibold mb-2 text-center" style={{ color: "var(--text-secondary)" }}>Akun Bawaan Sistem:</p>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div
                onClick={() => { setEmail("admin@absensinfc.com"); setPassword("admin123"); }}
                className="p-2.5 rounded-lg border cursor-pointer hover:border-purple-500/40 transition-all text-center"
                style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
              >
                <div className="text-purple-400 font-bold">ADMIN</div>
                <div className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>admin@absensinfc.com</div>
              </div>
              <div
                onClick={() => { setEmail("operator@absensinfc.com"); setPassword("operator123"); }}
                className="p-2.5 rounded-lg border cursor-pointer hover:border-teal-500/40 transition-all text-center"
                style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
              >
                <div className="text-teal-400 font-bold">OPERATOR</div>
                <div className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>operator@absensinfc.com</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
