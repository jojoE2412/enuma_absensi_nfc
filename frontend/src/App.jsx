import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import OperatorDashboard from "./pages/OperatorDashboard";
import EmployeeManagement from "./pages/EmployeeManagement";
import NfcRegistration from "./pages/NfcRegistration";
import AttendanceHistory from "./pages/AttendanceHistory";
import ChangePassword from "./pages/ChangePassword";

function MainApp() {
  const { user, profile, isAdmin, isOperator, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState("dashboard");

  useEffect(() => {
    if (isOperator && (currentTab === "employees" || currentTab === "nfc")) {
      setCurrentTab("dashboard");
    }
  }, [isOperator, currentTab]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm font-medium"
        style={{ backgroundColor: "var(--bg-page)", color: "var(--text-secondary)" }}>
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Memuat Sistem Absensi NFC...</span>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Login />;
  }

  return (
    <div className="min-h-screen flex flex-col selection:bg-blue-500 selection:text-white transition-colors duration-200"
      style={{ backgroundColor: "var(--bg-page)", color: "var(--text-primary)" }}>
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8">
        {currentTab === "dashboard" && (
          isAdmin
            ? <AdminDashboard setCurrentTab={setCurrentTab} />
            : <OperatorDashboard />
        )}
        {currentTab === "employees" && isAdmin && <EmployeeManagement />}
        {currentTab === "nfc"       && isAdmin && <NfcRegistration />}
        {currentTab === "history"   && <AttendanceHistory />}
        {currentTab === "password"  && <ChangePassword />}
      </main>

      <footer className="border-t py-4 text-center text-xs print:hidden"
        style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
        <p>SISTEM ABSENSI BERBASIS NFC © 2026 — Perangkat ACS ACR122U & Supabase PostgreSQL</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
