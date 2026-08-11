import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../lib/api";
import { AlertCircle, CheckCircle2, ShieldCheck, UserPlus, Users, XCircle } from "lucide-react";

export default function AdminAccounts() {
  const { session } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    status: "active"
  });

  async function fetchAdmins() {
    try {
      setLoading(true);
      const token = session?.access_token;
      const res = await fetch(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memuat admin.");
      setAdmins((json.data || []).filter((user) => user.role === "admin"));
    } catch (err) {
      console.error("fetchAdmins error:", err);
      setErrorMsg(err.message || "Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (session?.access_token) {
      fetchAdmins();
    }
  }, [session]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!formData.name || !formData.email || !formData.password) {
      setErrorMsg("Nama, email, dan password wajib diisi.");
      return;
    }

    try {
      const token = session?.access_token;
      const res = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          role: "admin"
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal membuat akun admin.");
      setSuccessMsg("Akun admin baru berhasil dibuat.");
      setFormData({ name: "", email: "", password: "", status: "active" });
      fetchAdmins();
    } catch (err) {
      console.error("createAdmin error:", err);
      setErrorMsg(err.message || "Terjadi kesalahan saat membuat admin.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-3xl border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-purple-400" />
              <span>Tambah Admin</span>
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              Buat akun admin baru untuk sistem. Admin dapat mengelola user, kartu NFC, dan laporan.
            </p>
          </div>
          <div className="rounded-3xl p-4 bg-slate-950/10 border border-slate-700/20 text-left shadow-sm max-w-sm">
            <p className="text-xs uppercase tracking-[0.25em] text-blue-400 font-semibold">Catatan</p>
            <p className="text-sm mt-2 text-slate-300">
              Admin pertama hanya satu pada awal proyek. Gunakan halaman ini untuk menambahkan admin baru.
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="glass-panel rounded-3xl border border-slate-800 p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            Daftar Admin yang Terdaftar
          </h3>
          {loading ? (
            <div className="text-sm text-slate-400">Memuat daftar admin...</div>
          ) : admins.length === 0 ? (
            <div className="text-sm text-slate-400">Belum ada admin selain akun awal.</div>
          ) : (
            <div className="space-y-3">
              {admins.map((admin) => (
                <div key={admin.id} className="rounded-3xl p-4 border border-slate-700/10 bg-white/5 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{admin.name}</p>
                    <p className="text-xs text-slate-400">{admin.email}</p>
                  </div>
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 text-xs border border-purple-500/20">
                    <Users className="w-4 h-4" /> ADMIN
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-panel rounded-3xl border border-slate-800 p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            Form Tambah Admin Baru
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Lengkap</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: Rina Wijaya"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="rina@absensinfc.com"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Status Akun</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 text-sm"
            >
              Buat Admin Baru
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
