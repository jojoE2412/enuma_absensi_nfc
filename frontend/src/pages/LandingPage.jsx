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
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center py-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold border mb-6 bg-blue-500/10 border-blue-500/30 text-blue-500">
          <Wifi className="w-3.5 h-3.5" /> Sistem Absensi Digital
        </div>

        <h2 className="text-4xl lg:text-6xl font-black mb-4 leading-tight" style={{ color: "var(--text-primary)" }}>
          Absensi Cepat &<br />
          <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
            Akurat dengan NFC
          </span>
        </h2>

        <p className="text-base max-w-xl mb-10" style={{ color: "var(--text-secondary)" }}>
          Sistem absensi modern berbasis kartu NFC menggunakan perangkat ACS ACR122U.
          Cukup tempelkan kartu — absensi tercatat otomatis secara realtime.
        </p>

        <button
          onClick={onEnter}
          className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-base font-bold rounded-2xl shadow-xl shadow-blue-500/30 flex items-center gap-3 transition-all"
        >
          <Radio className="w-5 h-5" /> Mulai Sekarang <ArrowRight className="w-5 h-5" />
        </button>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-16 max-w-3xl w-full">
          {[
            { icon: <Zap className="w-6 h-6 text-amber-500" />, bg: "bg-amber-500/10", border: "border-amber-500/20", title: "Tap & Go", desc: "Absensi hanya dengan menempelkan kartu NFC ke reader." },
            { icon: <Clock className="w-6 h-6 text-blue-500" />, bg: "bg-blue-500/10", border: "border-blue-500/20", title: "Realtime", desc: "Data absensi langsung tercatat dan tampil di dashboard." },
            { icon: <Shield className="w-6 h-6 text-emerald-500" />, bg: "bg-emerald-500/10", border: "border-emerald-500/20", title: "Aman & Akurat", desc: "Validasi kartu otomatis, mencegah absensi ganda." },
          ].map((f) => (
            <div key={f.title} className={`p-5 rounded-2xl border text-left ${f.bg} ${f.border}`}>
              <div className="mb-3">{f.icon}</div>
              <h3 className="font-bold text-sm mb-1" style={{ color: "var(--text-primary)" }}>{f.title}</h3>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="py-4 text-center text-xs border-t" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
        © 2026 Absensi Enuma Technology — ACS ACR122U & Supabase PostgreSQL
      </footer>
    </div>
  );
}
