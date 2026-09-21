import { useState } from "react";
import { api } from "./api/client.js";
import { Icon, icons, Input, Select } from "./components/ui.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import FloorsPage from "./pages/FloorsPage.jsx";
import RoomsPage from "./pages/RoomsPage.jsx";
import StudentsPage from "./pages/StudentsPage.jsx";
import AttendancePage from "./pages/AttendancePage.jsx";
import MultiDeptResultPage from "./pages/MultiDeptResultPage.jsx";
import { ReportsPage, UsersPage, SearchPage, ActivityPage, SettingsPage } from "./pages/OtherPages.jsx";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "chart", section: "Main" },
  { id: "floors", label: "Floors", icon: "building", section: "Hostel" },
  { id: "rooms", label: "Rooms", icon: "door", section: "Hostel" },
  { id: "students", label: "Students", icon: "users", section: "Hostel" },
  { id: "attendance", label: "Attendance", icon: "clock", section: "Analytics" },
  { id: "results", label: "Academics & GPA", icon: "award", section: "Analytics" },
  { id: "reports", label: "Reports", icon: "file", section: "Analytics" },
  { id: "search", label: "Universal Search", icon: "search", section: "System" },
  { id: "users", label: "User Access", icon: "lock", section: "System" },
  { id: "activity", label: "System Logs", icon: "history", section: "System" },
  { id: "settings", label: "Settings", icon: "gear", section: "System" },
];

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("hapams_token") || "");
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("hapams_user")) || null; } catch { return null; }
  });

  const [activeTab, setActiveTab] = useState("dashboard");
  const [email, setEmail] = useState("warden@hapams.edu");
  const [loginRole, setLoginRole] = useState("Warden");
  const [password, setPassword] = useState("admin123");
  const [loginErr, setLoginErr] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoginErr("");
    setLoggingIn(true);
    try {
      const data = await api.login({ email, role: loginRole, password });
      localStorage.setItem("hapams_token", data.token);
      localStorage.setItem("hapams_user", JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    } catch (err) {
      setLoginErr(err.message || "Invalid credentials");
    } finally {
      setLoggingIn(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("hapams_token");
    localStorage.removeItem("hapams_user");
    setToken("");
    setUser(null);
  }

  if (!token || !user) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4 font-sans antialiased text-[#1D1D1F]">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl border border-[#E5E5EA] animate-pop-in">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-[#0071E3] rounded-2xl flex items-center justify-center shadow-lg shadow-[#0071E3]/20 mb-4 scale-100 hover:scale-105 transition-transform">
              <Icon d={icons.building} size={32} color="#FFFFFF" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">HAPAMS</h1>
            <p className="text-xs text-[#86868B] font-medium mt-1">Hostel Academic Performance Analytics Management System</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginErr && (
              <div className="bg-[#FF3B30]/10 border border-[#FF3B30]/20 text-[#FF3B30] text-xs p-3 rounded-xl font-medium text-center">
                {loginErr}
              </div>
            )}

            <Input
              type="email"
              label="Email Address / Username"
              placeholder="e.g. warden@hapams.edu"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />

            <Select
              label="Select Access Role"
              value={loginRole}
              onChange={e => setLoginRole(e.target.value)}
              options={[
                { value: "Admin", label: "Administrator" },
                { value: "Warden", label: "Hostel Warden" },
                { value: "DeputyWarden", label: "Deputy Warden" },
                { value: "Advisor", label: "Academic Advisor" },
                { value: "RT", label: "Resident Tutor (RT)" },
              ]}
            />

            <Input
              type="password"
              label="Security Access Key / Password"
              placeholder="Enter password..."
              value={password}
              onChange={e => setPassword(e.target.value)}
            />

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full bg-[#0071E3] hover:bg-[#0077ED] text-white font-semibold py-3 px-4 rounded-xl shadow-md transition-all duration-300 disabled:opacity-50 mt-4 active:scale-95 cursor-pointer"
            >
              {loggingIn ? "Authenticating..." : "Sign In to Console"}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#E5E5EA] text-center text-[11px] text-[#86868B] space-y-1">
            <p className="font-semibold text-[#1D1D1F]">Default Credentials:</p>
            <p>Email: <code className="bg-[#F5F5F7] px-1.5 py-0.5 rounded font-mono text-[#0071E3]">warden@hapams.edu</code></p>
            <p>Password: <code className="bg-[#F5F5F7] px-1.5 py-0.5 rounded font-mono text-[#1D1D1F]">admin123</code></p>
          </div>
        </div>
      </div>
    );
  }

  const sections = ["Main", "Hostel", "Analytics", "System"];

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex font-sans antialiased text-[#1D1D1F]">
      {/* Translucent Sidebar */}
      <aside className="w-64 bg-white/70 backdrop-blur-xl border-r border-[#E5E5EA] flex flex-col fixed inset-y-0 z-30 shadow-xs">
        <div className="p-6 border-b border-[#E5E5EA]/60 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0071E3] rounded-xl flex items-center justify-center shadow-md shadow-[#0071E3]/20">
            <Icon d={icons.building} size={20} color="#FFFFFF" />
          </div>
          <div>
            <div className="font-bold text-base tracking-tight text-[#1D1D1F]">HAPAMS</div>
            <div className="text-[10px] font-semibold text-[#0071E3] uppercase tracking-wider">Apple Light v2.0</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-6 custom-scrollbar">
          {sections.map(sec => {
            const items = NAV.filter(n => n.section === sec);
            if (!items.length) return null;
            return (
              <div key={sec}>
                <div className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider px-3 mb-2">
                  {sec}
                </div>
                <div className="space-y-1">
                  {items.map(item => {
                    const active = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all duration-300 ${
                          active
                            ? "bg-[#0071E3] text-white shadow-md shadow-[#0071E3]/20 scale-[1.02]"
                            : "text-[#424245] hover:bg-[#F5F5F7] hover:text-[#1D1D1F]"
                        }`}
                      >
                        <Icon d={icons[item.icon]} size={16} color={active ? "#FFFFFF" : "#86868B"} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-[#E5E5EA]/60 bg-white/40 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-[#0071E3]/10 text-[#0071E3] font-bold flex items-center justify-center text-xs">
                {(user.name || user.email || user.role)[0].toUpperCase()}
              </div>
              <div className="truncate">
                <div className="font-semibold text-xs text-[#1D1D1F] truncate">{user.email || user.username || user.role}</div>
                <div className="text-[10px] text-[#86868B]">{user.role}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-[#86868B] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <Icon d={icons.logout} size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="pl-64 flex-1 flex flex-col min-h-screen">
        {/* Header Bar */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-[#E5E5EA] sticky top-0 z-20 flex items-center justify-between px-8 shadow-xs">
          <div className="flex items-center gap-2 text-xs text-[#86868B]">
            <span>Console</span>
            <span>/</span>
            <span className="font-semibold text-[#1D1D1F] capitalize">{activeTab}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 bg-[#34C759]/10 text-[#34C759] text-[11px] font-semibold px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse"></span>
              Live Database Connected
            </span>
          </div>
        </header>

        {/* Dynamic Page View */}
        <main className="flex-1 p-8">
          {activeTab === "dashboard"  && <DashboardPage />}
          {activeTab === "floors"     && <FloorsPage />}
          {activeTab === "rooms"      && <RoomsPage />}
          {activeTab === "students"   && <StudentsPage />}
          {activeTab === "attendance" && <AttendancePage />}
          {activeTab === "results"    && <MultiDeptResultPage />}
          {activeTab === "reports"    && <ReportsPage />}
          {activeTab === "search"     && <SearchPage />}
          {activeTab === "users"      && <UsersPage />}
          {activeTab === "activity"   && <ActivityPage />}
          {activeTab === "settings"   && <SettingsPage />}
        </main>
      </div>
    </div>
  );
}
