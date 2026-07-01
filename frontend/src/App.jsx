import { useState } from "react";
import { api } from "./api/client.js";
import { Icon, icons, Input, Select, Btn } from "./components/ui.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import StudentsPage  from "./pages/StudentsPage.jsx";
import FloorsPage    from "./pages/FloorsPage.jsx";
import RoomsPage     from "./pages/RoomsPage.jsx";
import { ReportsPage, UsersPage, SearchPage, ActivityPage, SettingsPage, ResultPage } from "./pages/OtherPages.jsx";

// ─── NAV CONFIG ───────────────────────────────────────────────────────────────
const NAV = [
  { id: "dashboard", label: "Dashboard",        icon: "dashboard", roles: ["Super Admin", "Warden"] },
  { id: "students",  label: "Student Master",    icon: "students",  roles: ["Super Admin"] },
  { id: "result",    label: "Result Analysis",   icon: "upload",    roles: ["Super Admin", "Warden"] },
  { id: "reports",   label: "Report History",    icon: "report",    roles: ["Super Admin", "Warden"] },
  { id: "floors",    label: "Floor Management",  icon: "floor",     roles: ["Super Admin"] },
  { id: "rooms",     label: "Room Management",   icon: "room",      roles: ["Super Admin"] },
  { id: "users",     label: "User Management",   icon: "users",     roles: ["Super Admin"] },
  { id: "search",    label: "Search",            icon: "search",    roles: ["Super Admin", "Warden"] },
  { id: "activity",  label: "Activity Log",      icon: "log",       roles: ["Super Admin"] },
  { id: "settings",  label: "Settings",          icon: "settings",  roles: ["Super Admin"] },
];

const PAGES = {
  dashboard: DashboardPage,
  students:  StudentsPage,
  result:    ResultPage,
  reports:   ReportsPage,
  floors:    FloorsPage,
  rooms:     RoomsPage,
  users:     UsersPage,
  search:    SearchPage,
  activity:  ActivityPage,
  settings:  SettingsPage,
};

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [form,    setForm]    = useState({ email: "admin@hostel.edu", password: "Admin@123", role: "Super Admin" });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const { user } = await api.login(form);
      onLogin({ role: form.role, email: form.email, name: user.name || form.email });
    } catch (e) {
      setError(e.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: "#0A1628", minHeight: "100vh" }} className="flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div style={{ background: "linear-gradient(135deg,#2563EB,#1D4ED8)" }}
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
            <Icon d={icons.hostel} size={26} color="white" />
          </div>
          <h1 className="text-white text-2xl font-bold">HAPAMS</h1>
          <p className="text-slate-500 text-sm mt-1">Hostel Academic Performance Analytics</p>
        </div>
        <div style={{ background: "#162033", border: "1px solid #263548" }} className="rounded-2xl p-8">
          <div className="flex flex-col gap-4">
            <Input label="Email" type="email" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="admin@hostel.edu" />
            <Input label="Password" type="password" value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
            <Select label="Login as" value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              options={[{ value: "Super Admin", label: "Super Admin" }, { value: "Warden", label: "Warden" }]} />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button onClick={submit} disabled={loading}
              style={{ background: loading ? "#1D4ED8" : "linear-gradient(135deg,#2563EB,#1D4ED8)" }}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-70">
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </div>
          <p className="text-slate-600 text-xs text-center mt-4">Demo: use any credentials</p>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [auth,        setAuth]        = useState(null);
  const [page,        setPage]        = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!auth) return <LoginPage onLogin={u => setAuth(u)} />;

  const nav         = NAV.filter(n => n.roles.includes(auth.role));
  const CurrentPage = PAGES[page] || DashboardPage;

  return (
    <div style={{ background: "#0A1628", minHeight: "100vh", fontFamily: "'Inter',sans-serif" }} className="flex">
      {/* ── Sidebar ── */}
      <aside style={{ background: "#0D1E32", borderRight: "1px solid #1A2A3E", width: 240, minWidth: 240 }}
        className={`fixed inset-y-0 left-0 z-40 flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-5 border-b border-slate-800/60 flex items-center gap-3">
          <div style={{ background: "linear-gradient(135deg,#2563EB,#1D4ED8)" }}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow shadow-blue-600/30">
            <Icon d={icons.hostel} size={18} color="white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">HAPAMS</div>
            <div className="text-slate-500 text-xs">{auth.role}</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {nav.map(n => (
            <button key={n.id} onClick={() => { setPage(n.id); setSidebarOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm transition-all text-left"
              style={page === n.id
                ? { background: "#1E3A5F", color: "#60A5FA", fontWeight: 600 }
                : { color: "#64748B" }}>
              <Icon d={icons[n.icon]} size={16} color={page === n.id ? "#60A5FA" : "#475569"} />
              {n.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800/60">
          <button onClick={() => setAuth(null)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <Icon d={icons.logout} size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col lg:ml-[240px] min-w-0">
        <header style={{ background: "#0D1E32", borderBottom: "1px solid #1A2A3E" }}
          className="h-14 flex items-center px-4 gap-3 sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400 hover:text-white">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h14M3 10h14M3 14h14" />
            </svg>
          </button>
          <div className="flex-1" />
          <div style={{ background: "#1E2E45" }} className="flex items-center gap-2 px-3 py-1.5 rounded-lg">
            <div style={{ background: "#2563EB" }}
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white">
              {auth.role[0]}
            </div>
            <span className="text-slate-300 text-xs font-medium hidden sm:block">{auth.role}</span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
          <CurrentPage role={auth.role} />
        </main>
      </div>
    </div>
  );
}
