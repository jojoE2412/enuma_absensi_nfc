import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../lib/api";
import {
  Users,
  UserPlus,
  Trash2,
  Edit3,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";

export default function UserManagement() {
  const { session, profile: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" | "edit"
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    email: "",
    password: "",
    role: "operator",
    status: "active"
  });

  async function fetchUsers() {
    try {
      setLoading(true);
      const token = session?.access_token;
      const res = await fetch(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setUsers(json.data);
      } else {
        setErrorMsg(json.error || "Gagal memuat daftar user.");
      }
    } catch (err) {
      console.error("fetchUsers error:", err);
      setErrorMsg("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, [session]);

  const openAddModal = () => {
    setModalMode("add");
    setFormData({ id: "", name: "", email: "", password: "", role: "operator", status: "active" });
    setErrorMsg("");
    setSuccessMsg("");
    setShowModal(true);
  };

  const openEditModal = (u) => {
    setModalMode("edit");
    setFormData({
      id: u.id,
      name: u.name || "",
      email: u.email || "",
      password: "",
      role: u.role || "operator",
      status: u.status || "active"
    });
    setErrorMsg("");
    setSuccessMsg("");
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const token = session?.access_token;
      if (modalMode === "add") {
        const res = await fetch(`${API_URL}/users`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Gagal membuat user.");
        setSuccessMsg("User baru berhasil ditambahkan!");
      } else {
        const res = await fetch(`${API_URL}/users/${formData.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: formData.name,
            role: formData.role,
            status: formData.status,
            email: formData.email,
            password: formData.password || undefined
          })
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Gagal memperbarui user.");
        setSuccessMsg("Data user berhasil diperbarui!");
      }

      setShowModal(false);
      fetchUsers();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleDelete = async (userToDelete) => {
    if (userToDelete.id === currentUser?.id) {
      alert("Anda tidak dapat menghapus akun Anda sendiri.");
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus user "${userToDelete.name}" beserta seluruh data absensi dan kartu terkait?`)) {
      return;
    }

    try {
      const token = session?.access_token;
      const res = await fetch(`${API_URL}/users/${userToDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menghapus user.");
      
      setSuccessMsg(`User "${userToDelete.name}" telah dihapus.`);
      fetchUsers();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-400" />
            <span>Manajemen User</span>
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Kelola data akun pengguna, role Admin / Operator, dan status aktif.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 text-xs flex items-center gap-2 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>TAMBAH USER BARU</span>
        </button>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        {loading ? (
          <div className="text-center py-8 text-slate-500 text-sm">Memuat data user...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase">
                  <th className="py-3 px-4">Nama Lengkap</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status Kartu NFC</th>
                  <th className="py-3 px-4">Status Akun</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-200">
                      {u.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-xs">{u.email}</td>
                    <td className="py-3.5 px-4">
                      {u.role === "admin" ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          ADMIN
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                          OPERATOR
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-300">
                      {u.nfc_card ? (
                        <span className="px-2 py-0.5 bg-slate-800 rounded border border-slate-700 text-blue-300">
                          {u.nfc_card.uid} ({u.nfc_card.status})
                        </span>
                      ) : (
                        <span className="text-slate-500">Belum Terhubung</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {u.status === "active" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-400">
                          <XCircle className="w-3.5 h-3.5" /> Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(u)}
                        title="Edit User"
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        disabled={u.id === currentUser?.id}
                        title={u.id === currentUser?.id ? "Tidak dapat menghapus diri sendiri" : "Hapus User"}
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Add / Edit User */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-slate-800 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-4">
              {modalMode === "add" ? "Tambah User Baru" : "Edit Data User"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="budi@absensinfc.com"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {modalMode === "add" ? "Password" : "Password Baru (Opsional)"}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={modalMode === "add"}
                  placeholder={modalMode === "add" ? "••••••••" : "Biarkan kosong jika tidak diubah"}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="operator">Operator</option>
                    <option value="admin">Admin</option>
                  </select>
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
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/20"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
