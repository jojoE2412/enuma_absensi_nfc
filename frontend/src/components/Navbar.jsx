import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  ShieldCheck, Users, CreditCard, Clock, Key, LogOut,
  LayoutDashboard, Radio, Sun, Moon, UserCheck
} from "lucide-react";

export default function Navbar({ currentTab, setCurrentTab }) {
  const { profile, isAdmin, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const navBtnClass = (tab) =>
    `flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
      currentTab === tab
        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
        : isDark
          ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/60"
    }`;

  const mobileBtnClass = (tab) =>
    `flex flex-col items-center py-1 text-xs font-medium ${
      currentTab === tab
        ? "text-blue-500 font-bold"
        : isDark ? "text-slate-400" : "text-slate-500"
    }`;

  return (
    <header className="sticky top-0 z-40 glass-panel border-b px-4 lg:px-8 py-3 print:hidden"
      style={{ borderColor: "var(--border)" }}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab("dashboard")}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg glow-blue flex-shrink-0">
            <Radio className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-500 to-indigo-400 bg-clip-text text-transparent tracking-wide">
              Absensi Enuma Technology
            </h1>
            <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>ACS ACR122U System</p>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-1 p-1.5 rounded-xl border"
          style={{ backgroundColor: isDark ? "rgba(15,23,42,0.6)" : "rgba(241,245,249,0.8)", borderColor: "var(--border)" }}>
          <button onClick={() => setCurrentTab("dashboard")} className={navBtnClass("dashboard")}>
            <LayoutDashboard className="w-4 h-4" /><span>Dashboard</span>
          </button>

          {isAdmin && (
            <>
              <button onClick={() => setCurrentTab("users")} className={navBtnClass("users")}>
                <Users className="w-4 h-4" /><span>Manajemen User</span>
              </button>
              <button onClick={() => setCurrentTab("employees")} className={navBtnClass("employees")}>
                <ShieldCheck className="w-4 h-4" /><span>Data Pegawai</span>
              </button>
              <button onClick={() => setCurrentTab("nfc")} className={navBtnClass("nfc")}>
                <CreditCard className="w-4 h-4" /><span>Registrasi NFC</span>
              </button>
            </>
          )}

          <button onClick={() => setCurrentTab("history")} className={navBtnClass("history")}>
            <Clock className="w-4 h-4" /><span>Riwayat Absensi</span>
          </button>

          {!isAdmin && (
            <button onClick={() => setCurrentTab("manual")} className={navBtnClass("manual")}>
              <UserCheck className="w-4 h-4" /><span>Absensi Manual</span>
            </button>
          )}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center space-x-2">
          {/* User info */}
          <div className="text-right hidden sm:block mr-1">
            <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {profile?.name || "Pengguna"}
            </div>
            <div className="flex justify-end mt-0.5">
              {isAdmin ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <ShieldCheck className="w-3 h-3" /> ADMIN
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-400 border border-teal-500/30">
                  OPERATOR
                </span>
              )}
            </div>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? "Ganti ke Light Mode" : "Ganti ke Dark Mode"}
            className="p-2 rounded-xl border transition-all"
            style={{
              backgroundColor: isDark ? "rgba(30,41,59,0.6)" : "rgba(241,245,249,0.9)",
              borderColor: "var(--border)",
              color: isDark ? "#fbbf24" : "#6366f1"
            }}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Change Password */}
          <button
            onClick={() => setCurrentTab("password")}
            title="Ubah Password"
            className="p-2 rounded-xl border transition-all"
            style={{
              backgroundColor: currentTab === "password"
                ? undefined
                : isDark ? "rgba(15,23,42,0.6)" : "rgba(241,245,249,0.9)",
              borderColor: currentTab === "password" ? "#3b82f6" : "var(--border)",
              color: currentTab === "password" ? "#fff" : "var(--text-secondary)",
              background: currentTab === "password" ? "#2563eb" : undefined
            }}
          >
            <Key className="w-4 h-4" />
          </button>

          {/* Logout */}
          <button
            onClick={signOut}
            title="Logout"
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all text-xs font-semibold"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="md:hidden flex items-center justify-around mt-3 pt-2 border-t"
        style={{ borderColor: "var(--border)" }}>
        <button onClick={() => setCurrentTab("dashboard")} className={mobileBtnClass("dashboard")}>
          <LayoutDashboard className="w-4 h-4 mb-0.5" />Dashboard
        </button>
        {isAdmin && (
          <>
            <button onClick={() => setCurrentTab("users")} className={mobileBtnClass("users")}>
              <Users className="w-4 h-4 mb-0.5" />Akun
            </button>
            <button onClick={() => setCurrentTab("employees")} className={mobileBtnClass("employees")}>
              <ShieldCheck className="w-4 h-4 mb-0.5" />Pegawai
            </button>
            <button onClick={() => setCurrentTab("nfc")} className={mobileBtnClass("nfc")}>
              <CreditCard className="w-4 h-4 mb-0.5" />NFC
            </button>
          </>
        )}
        <button onClick={() => setCurrentTab("history")} className={mobileBtnClass("history")}>
          <Clock className="w-4 h-4 mb-0.5" />Riwayat
        </button>
        {!isAdmin && (
          <button onClick={() => setCurrentTab("manual")} className={mobileBtnClass("manual")}>
            <UserCheck className="w-4 h-4 mb-0.5" />Manual
          </button>
        )}
        <button onClick={toggleTheme} className={mobileBtnClass("")}>
          {isDark ? <Sun className="w-4 h-4 mb-0.5 text-amber-400" /> : <Moon className="w-4 h-4 mb-0.5 text-indigo-500" />}
          {isDark ? "Light" : "Dark"}
        </button>
      </div>
    </header>
  );
}
