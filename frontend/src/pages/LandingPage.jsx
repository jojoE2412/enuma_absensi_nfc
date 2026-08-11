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
        </div>

        <div className="relative z-10 max-w-5xl w-full">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold border mb-6 bg-blue-500/10 border-blue-500/30 text-blue-500 shadow-sm">
            <Wifi className="w-3.5 h-3.5" /> Sistem Absensi Digital
          </div>

          <h2 className="text-4xl lg:text-6xl font-black mb-4 leading-tight" style={{ color: "var(--text-primary)" }}>
            Absensi Cepat &<br />
            <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
              Akurat dengan NFC
            </span>
          </h2>

          <p className="text-base max-w-2xl mx-auto mb-10" style={{ color: "var(--text-secondary)" }}>
            Sistem absensi modern berbasis kartu NFC menggunakan perangkat ACS ACR122U.
            Cukup tempelkan kartu — absensi tercatat otomatis dan aman di dashboard Anda.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center sm:items-center mb-12">
            <div className="rounded-[1.75rem] bg-slate-950/5 border border-slate-700/10 px-5 py-4 text-left shadow-sm w-full sm:w-auto">
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Registrasi Cepat</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Tambahkan kartu dan data pegawai tanpa proses rumit.</p>
            </div>
            <div className="rounded-[1.75rem] bg-slate-950/5 border border-slate-700/10 px-5 py-4 text-left shadow-sm w-full sm:w-auto">
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Laporan Ringkas</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Pantau riwayat hadir dan laporan kehadiran dengan mudah.</p>
            </div>
          </div>

          <button
            onClick={onEnter}
            className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-base font-bold rounded-2xl shadow-xl shadow-blue-500/30 gap-3 transition-all mx-auto"
          >
            <Radio className="w-5 h-5" /> Mulai Sekarang <ArrowRight className="w-5 h-5" />
          </button>

          <section className="mt-16 bg-slate-950/5 border border-slate-700/10 rounded-[2rem] p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-6 text-left">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-blue-500 font-bold">Fitur Utama</p>
                <h3 className="text-2xl font-bold mt-3" style={{ color: "var(--text-primary)" }}>Semua fitur absensi dalam satu dashboard</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                { icon: <Zap className="w-5 h-5 text-amber-500" />, title: "Absensi NFC", desc: "Tap kartu NFC untuk check-in dan check-out cepat." },
                { icon: <Clock className="w-5 h-5 text-blue-500" />, title: "Riwayat Lengkap", desc: "Catatan kehadiran tersimpan otomatis dan dapat dicari." },
                { icon: <Shield className="w-5 h-5 text-emerald-500" />, title: "Akses Aman", desc: "Hanya kartu terdaftar yang dapat melakukan absensi." },
                { icon: <Radio className="w-5 h-5 text-violet-500" />, title: "Dashboard Admin", desc: "Kelola pegawai dan laporan langsung dari panel." },
              ].map((item) => (
                <div key={item.title} className="rounded-3xl p-5 bg-white/7 border border-slate-700/10">
                  <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-slate-950/10 mb-4">
                    {item.icon}
                  </div>
                  <h4 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>{item.title}</h4>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <footer className="py-4 text-center text-xs border-t" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
        © 2026 Absensi Enuma Technology — ACS ACR122U & Supabase PostgreSQL
      </footer>
    </div>
  );
}
