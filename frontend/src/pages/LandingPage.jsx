import { Radio, Shield, Clock, Zap, ArrowRight, Wifi } from "lucide-react";

export default function LandingPage({ onEnter }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg-page)" }}>

      {/* Navbar */}
      <header className="px-6 lg:px-12 py-4 flex items-center justify-between border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg">
            <Radio className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
              Absensi Enuma Technology
            </h1>
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Sistem Absensi Berbasis NFC</p>
          </div>
        </div>
        <button
          onClick={onEnter}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all"
        >
          Masuk <ArrowRight className="w-4 h-4" />
        </button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center py-16 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-10 left-1/2 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl -translate-x-1/2" />
          <div className="absolute bottom-16 right-10 w-56 h-56 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute top-28 left-10 w-40 h-40 rounded-full bg-emerald-500/10 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-6xl w-full grid gap-12 xl:grid-cols-[1.3fr_0.9fr] items-center">
          <div className="text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold border mb-6 bg-blue-500/10 border-blue-500/30 text-blue-500 shadow-sm">
              <Wifi className="w-3.5 h-3.5" /> Sistem Absensi NFC untuk Perusahaan
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6 leading-tight" style={{ color: "var(--text-primary)" }}>
              Absensi Karyawan Modern dengan Kontrol Admin Lengkap
            </h1>

            <p className="text-base sm:text-lg max-w-3xl mb-8" style={{ color: "var(--text-secondary)" }}>
              Platform absensi berbasis ACS ACR122U yang mendukung multi-admin, manajemen operator, kartu NFC, absensi otomatis, absensi manual, dan laporan riwayat lengkap.
            </p>

            <div className="grid gap-4 sm:grid-cols-2 max-w-2xl mb-10">
              <div className="rounded-[1.75rem] bg-slate-950/5 border border-slate-700/10 px-5 py-4 text-left shadow-sm">
                <p className="text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Admin Multilevel</p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Admin dapat membuat akun admin baru dan mengelola seluruh akses.</p>
              </div>
              <div className="rounded-[1.75rem] bg-slate-950/5 border border-slate-700/10 px-5 py-4 text-left shadow-sm">
                <p className="text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Laporan Jadwal</p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Pantau jumlah hadir, terlambat, dan absensi harian secara real-time.</p>
              </div>
            </div>

            <button
              onClick={onEnter}
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-base font-bold rounded-2xl shadow-xl shadow-blue-500/30 transition-all"
            >
              <Radio className="w-5 h-5" /> Masuk ke Aplikasi <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <div className="rounded-[2rem] border border-slate-700/20 bg-slate-950/5 p-6 sm:p-8 shadow-xl">
            <h2 className="text-xl font-bold mb-5" style={{ color: "var(--text-primary)" }}>Fitur yang sudah tersedia</h2>
            <div className="space-y-4">
              {[
                { icon: <Zap className="w-5 h-5 text-amber-400" />, title: "Absensi NFC", desc: "Tap kartu ke reader untuk absen masuk dan pulang otomatis." },
                { icon: <Users className="w-5 h-5 text-blue-400" />, title: "Multi Admin & Operator", desc: "Buat admin baru dan kelola akun operator dari satu panel." },
                { icon: <CreditCard className="w-5 h-5 text-indigo-400" />, title: "Registrasi Kartu NFC", desc: "Daftarkan kartu NFC langsung ke profil pegawai dengan mudah." },
                { icon: <Clock className="w-5 h-5 text-emerald-400" />, title: "Riwayat Absensi", desc: "Lihat catatan hadir per hari, beserta status masuk dan pulang." },
                { icon: <Shield className="w-5 h-5 text-teal-400" />, title: "Akses Aman", desc: "Hanya pengguna terdaftar dapat masuk ke sistem." },
                { icon: <Radio className="w-5 h-5 text-violet-400" />, title: "Absensi Manual", desc: "Operator dapat menambah absensi manual saat diperlukan." }
              ].map((item) => (
                <div key={item.title} className="rounded-3xl border border-slate-700/10 bg-white/5 p-4 flex gap-4 items-start">
                  <div className="w-11 h-11 rounded-2xl bg-slate-950/15 flex items-center justify-center text-slate-100">
                    {item.icon}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{item.title}</p>
                    <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <section className="bg-slate-950/5 border-t border-slate-700/20 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <p className="uppercase text-xs tracking-[0.3em] text-blue-500 font-bold">Apa yang bisa Anda lakukan</p>
            <h3 className="text-3xl font-bold mt-3" style={{ color: "var(--text-primary)" }}>Seluruh fitur lengkap tersedia di web</h3>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              { title: "Kelola User", desc: "Buat admin/operator, edit data akun, dan nonaktifkan akses saat dibutuhkan." },
              { title: "Registrasi NFC", desc: "Hubungkan kartu NFC dengan profil pegawai melalui panel registrasi." },
              { title: "Laporan & Riwayat", desc: "Telusuri absensi harian dan laporan bulanan dari satu tempat." },
            ].map((item) => (
              <div key={item.title} className="rounded-[2rem] border border-slate-700/10 bg-white/5 p-6 shadow-sm">
                <h4 className="text-lg font-semibold mb-3" style={{ color: "var(--text-primary)" }}>{item.title}</h4>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-4 text-center text-xs border-t" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
        © 2026 Absensi Enuma Technology — ACS ACR122U & Supabase PostgreSQL
      </footer>
    </div>
  );
}
