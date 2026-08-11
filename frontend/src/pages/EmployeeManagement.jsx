import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../lib/api";
import {
  Users, UserPlus, Trash2, Edit3, CheckCircle2, XCircle,
  AlertCircle, CreditCard, RefreshCw, ShieldOff
} from "lucide-react";

const API = `${API_URL}`;

const ic = "w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-none focus:border-blue-500 transition-all";
const is = { backgroundColor: "var(--bg-input)", borderColor: "var(--border-strong)", color: "var(--text-primary)" };

export default function EmployeeManagement() {
  const { session } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [showFormModal, setShowFormModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [formData, setFormData] = useState({ id: "", name: "", employee_number: "", status: "active" });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [empToDelete, setEmpToDelete] = useState(null);

  const [showCardModal, setShowCardModal] = useState(false);
  const [cardModalMode, setCardModalMode] = useState("register");
  const [cardTarget, setCardTarget] = useState(null);
  const [cardUidInput, setCardUidInput] = useState("");
  const [cardLoading, setCardLoading] = useState(false);
  const [unusedCards, setUnusedCards] = useState([]);

  const token = () => session?.access_token;

  async function fetchEmployees() {
    try {
      setLoading(true);
      const res = await fetch(`${API}/employees`, { headers: { Authorization: `Bearer ${token()}` } });
      const json = await res.json();
      if (res.ok && json.data) setEmployees(json.data);
      else setErrorMsg(json.error || "Gagal memuat daftar User.");
    } catch {
      setErrorMsg("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchEmployees(); }, [session]);

  function clearMessages() { setErrorMsg(""); setSuccessMsg(""); }

  const openAddModal = () => {
    setModalMode("add");
    setFormData({ id: "", name: "", employee_number: "", status: "active" });
    clearMessages(); setShowFormModal(true);
  };

  const openEditModal = (emp) => {
    setModalMode("edit");
    setFormData({ id: emp.id, name: emp.name || "", employee_number: emp.employee_number || "", status: emp.status || "active" });
    clearMessages(); setShowFormModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault(); clearMessages();
    try {
      const url = modalMode === "add" ? `${API}/employees` : `${API}/employees/${formData.id}`;
      const res = await fetch(url, {
        method: modalMode === "add" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan data.");
      setSuccessMsg(modalMode === "add" ? "User baru berhasil ditambahkan!" : "Data User berhasil diperbarui!");
      setShowFormModal(false); fetchEmployees();
    } catch (err) { setErrorMsg(err.message); }
  };

  const openDeleteModal = (emp) => { setEmpToDelete(emp); clearMessages(); setShowDeleteModal(true); };

  const handleDelete = async (deleteAttendance) => {
    if (!empToDelete) return;
    try {
      const res = await fetch(`${API}/employees/${empToDelete.id}?deleteAttendance=${deleteAttendance}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token()}` }
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menghapus User.");
      setSuccessMsg(json.message); setShowDeleteModal(false); setEmpToDelete(null); fetchEmployees();
    } catch (err) { setErrorMsg(err.message); setShowDeleteModal(false); }
  };

  const openRegisterCard = async (emp) => {
    setCardModalMode("register"); setCardTarget(emp); setCardUidInput(""); clearMessages(); setShowCardModal(true);
    try {
      const res = await fetch(`${API}/nfc/cards`, { headers: { Authorization: `Bearer ${token()}` } });
      const json = await res.json();
      if (res.ok && json.data) setUnusedCards(json.data.filter(c => !c.employee_id));
    } catch { setUnusedCards([]); }
  };
  const openChangeCard   = (emp) => { setCardModalMode("change");   setCardTarget(emp); setCardUidInput(""); clearMessages(); setShowCardModal(true); };

  const handleCardSubmit = async (e) => {
    e.preventDefault();
    if (!cardUidInput.trim()) { setErrorMsg("UID kartu wajib diisi."); return; }
    setCardLoading(true); clearMessages();
    try {
      const endpoint = cardModalMode === "register" ? `${API}/nfc/register` : `${API}/nfc/change`;
      const body = cardModalMode === "register"
        ? { employee_id: cardTarget.id, uid: cardUidInput }
        : { employee_id: cardTarget.id, new_uid: cardUidInput };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(body)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan kartu.");
      setSuccessMsg(json.message); setShowCardModal(false); fetchEmployees();
    } catch (err) { setErrorMsg(err.message); }
    finally { setCardLoading(false); }
  };

  const handleDeactivateCard = async (emp) => {
    if (!emp.nfc_card) return;
    if (!confirm(`Nonaktifkan kartu NFC (${emp.nfc_card.uid}) milik "${emp.name}"?`)) return;
    clearMessages();
    try {
      const res = await fetch(`${API}/nfc/cards/${emp.nfc_card.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ status: "inactive" })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menonaktifkan kartu.");
      setSuccessMsg(`Kartu (${emp.nfc_card.uid}) berhasil dinonaktifkan.`); fetchEmployees();
    } catch (err) { setErrorMsg(err.message); }
  };

  useEffect(() => {
    if (!showCardModal) return;
    const sse = new EventSource("http://localhost:3001/api/nfc/stream");
    sse.addEventListener("nfc_tap", (e) => {
      try { const d = JSON.parse(e.data); if (d.uid) setCardUidInput(d.uid); } catch {}
    });
    return () => sse.close();
  }, [showCardModal]);

  const cancelBtnStyle = { backgroundColor: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-secondary)" };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Users className="w-6 h-6 text-blue-500" /><span>Manajemen User</span>
          </h2>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Kelola data User yang melakukan absensi menggunakan kartu NFC.</p>
        </div>
        <button onClick={openAddModal}
          className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 text-xs flex items-center gap-2 transition-all">
          <UserPlus className="w-4 h-4" /> TAMBAH USER
        </button>
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

      {/* Table */}
      <div className="glass-panel p-6 rounded-2xl">
        {loading ? (
          <div className="text-center py-8 text-sm" style={{ color: "var(--text-muted)" }}>Memuat data User...</div>
        ) : employees.length === 0 ? (
          <div className="text-center py-8 text-sm" style={{ color: "var(--text-muted)" }}>Belum ada data User.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs font-semibold uppercase" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                  <th className="py-3 px-3">Nama User</th>
                  <th className="py-3 px-3">NIP</th>
                  <th className="py-3 px-3">Status User</th>
                  <th className="py-3 px-3">Status Kartu</th>
                  <th className="py-3 px-3">UID Kartu</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                {employees.map((emp) => {
                  const card = emp.nfc_card;
                  const hasActiveCard = card && card.status === "active";
                  return (
                    <tr key={emp.id} className="hover:bg-black/5 transition-colors">
                      <td className="py-3 px-3 font-semibold" style={{ color: "var(--text-primary)" }}>{emp.name}</td>
                      <td className="py-3 px-3 font-mono text-xs" style={{ color: "var(--text-muted)" }}>{emp.employee_number || "-"}</td>
                      <td className="py-3 px-3">
                        {emp.status === "active"
                          ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-500"><CheckCircle2 className="w-3.5 h-3.5" /> Aktif</span>
                          : <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-500"><XCircle className="w-3.5 h-3.5" /> Nonaktif</span>
                        }
                      </td>
                      <td className="py-3 px-3">
                        {hasActiveCard
                          ? <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">Aktif</span>
                          : card
                            ? <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-500 border border-red-500/30">Nonaktif</span>
                            : <span className="text-xs" style={{ color: "var(--text-muted)" }}>Belum Ada Kartu</span>
                        }
                      </td>
                      <td className="py-3 px-3 font-mono text-xs text-blue-500">{card ? card.uid : "-"}</td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button onClick={() => openEditModal(emp)} title="Edit User"
                            className="p-1.5 rounded-lg border transition-all" style={cancelBtnStyle}>
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {!hasActiveCard && (
                            <button onClick={() => openRegisterCard(emp)} title="Registrasi Kartu NFC"
                              className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 text-xs font-bold border border-blue-500/30 flex items-center gap-1">
                              <CreditCard className="w-3 h-3" /> Registrasi
                            </button>
                          )}
                          {hasActiveCard && (
                            <button onClick={() => openChangeCard(emp)} title="Ganti Kartu NFC"
                              className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 text-xs font-bold border border-amber-500/30 flex items-center gap-1">
                              <RefreshCw className="w-3 h-3" /> Ganti
                            </button>
                          )}
                          {hasActiveCard && (
                            <button onClick={() => handleDeactivateCard(emp)} title="Nonaktifkan Kartu NFC"
                              className="px-2 py-1 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-bold border border-red-500/30 flex items-center gap-1">
                              <ShieldOff className="w-3 h-3" /> Nonaktifkan
                            </button>
                          )}
                          <button onClick={() => openDeleteModal(emp)} title="Hapus User"
                            className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add / Edit */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl shadow-2xl">
            <h3 className="text-lg font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              {modalMode === "add" ? "Tambah User Baru" : "Edit Data User"}
            </h3>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>Nama Lengkap *</label>
                <input type="text" required value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Ahmad Subagyo" className={ic} style={is} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>NIP *</label>
                <input type="text" required pattern="[A-Za-z0-9]+" title="NIP hanya boleh berisi huruf dan angka." value={formData.employee_number}
                  onChange={(e) => setFormData({ ...formData, employee_number: e.target.value })}
                  placeholder="Contoh: EMP-2026-001" className={`${ic} font-mono`} style={is} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>Status User</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className={ic} style={is}>
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </select>
              </div>
              {errorMsg && <p className="text-red-500 text-xs">{errorMsg}</p>}
              <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
                <button type="button" onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl border" style={cancelBtnStyle}>Batal</button>
                <button type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete — 2 Pilihan */}
      {showDeleteModal && empToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-red-500/30 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Hapus User</h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>"{empToDelete.name}"</p>
              </div>
            </div>
            <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>Pilih metode penghapusan:</p>
            <div className="space-y-3">
              <button onClick={() => handleDelete(false)}
                className="w-full p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-left transition-all">
                <p className="text-sm font-bold text-amber-500">Hapus User Saja</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Riwayat absensi tetap tersimpan. Kartu NFC dilepas dan dapat didaftarkan ke User lain.</p>
              </button>
              <button onClick={() => handleDelete(true)}
                className="w-full p-4 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-left transition-all">
                <p className="text-sm font-bold text-red-500">Hapus User dan Data Absensinya</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Seluruh riwayat absensi User ini akan dihapus permanen. Kartu NFC dilepas.</p>
              </button>
            </div>
            <button onClick={() => { setShowDeleteModal(false); setEmpToDelete(null); }}
              className="w-full mt-4 py-2 text-xs font-bold rounded-xl border" style={cancelBtnStyle}>Batal</button>
          </div>
        </div>
      )}

      {/* Modal: Registrasi / Ganti Kartu */}
      {showCardModal && cardTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                  {cardModalMode === "register" ? "Registrasi Kartu NFC" : "Ganti Kartu NFC"}
                </h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>User: {cardTarget.name}</p>
              </div>
            </div>
            {cardModalMode === "change" && cardTarget.nfc_card && (
              <div className="mb-4 p-3 rounded-xl border" style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border)" }}>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Kartu Aktif Saat Ini:</p>
                <p className="font-mono font-bold text-amber-500 text-sm mt-0.5">{cardTarget.nfc_card.uid}</p>
              </div>
            )}
            <form onSubmit={handleCardSubmit} className="space-y-4">
              {cardModalMode === "register" && unusedCards.length > 0 && (
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>Kartu Tidak Terpakai</label>
                <div className="flex flex-wrap gap-2">
                  {unusedCards.map(c => (
                    <button key={c.id} type="button"
                      onClick={() => setCardUidInput(c.uid)}
                      className={`px-3 py-1.5 rounded-lg border font-mono text-xs font-bold transition-all ${
                        cardUidInput === c.uid
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-blue-500/10 text-blue-500 border-blue-500/30 hover:bg-blue-500/20"
                      }`}>
                      {c.uid}
                    </button>
                  ))}
                </div>
                <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>Klik UID untuk memilih kartu yang sudah ada.</p>
              </div>
            )}
            <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
                  {cardModalMode === "register" ? "UID Kartu NFC" : "UID Kartu Baru"} *
                </label>
                <input type="text" value={cardUidInput}
                  onChange={(e) => setCardUidInput(e.target.value.toUpperCase().replace(/[^A-F0-9]/g, ""))}
                  placeholder="Tempelkan kartu ke ACS ACR122U atau ketik manual..."
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 border-blue-500/50 font-mono font-bold text-lg tracking-widest focus:outline-none focus:border-blue-400"
                  style={{ backgroundColor: "var(--bg-input)", color: "var(--text-primary)" }} />
                <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>UID terisi otomatis saat kartu ditap pada ACS ACR122U.</p>
              </div>
              {errorMsg && <p className="text-red-500 text-xs">{errorMsg}</p>}
              <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
                <button type="button" onClick={() => setShowCardModal(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl border" style={cancelBtnStyle}>Batal</button>
                <button type="submit" disabled={cardLoading || !cardUidInput}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl">
                  {cardLoading ? "Menyimpan..." : "Simpan Kartu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
