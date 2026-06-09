import { ClipboardList, FileBarChart2, Gauge, History, LogOut, ShieldCheck } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";

const navItems = [
  { to: "/", label: "Dashboard", icon: Gauge },
  { to: "/test-entry", label: "Test Entry", icon: ClipboardList },
  { to: "/history", label: "History", icon: History },
  { to: "/reports", label: "Reports", icon: FileBarChart2 },
  { to: "/users", label: "Users", icon: ShieldCheck, roles: ["admin"] },
];

function AppLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-grid-pattern bg-[size:16px_16px]">
      <div className="mx-auto grid max-w-[1400px] gap-4 p-4 md:grid-cols-[260px_1fr]">
        <aside className="panel h-fit p-4">
          <h1 className="text-lg font-bold">Instrument Testing Tracker</h1>
          <p className="mt-1 text-xs text-muted">Surgical Production QA</p>

          <nav className="mt-4 space-y-1">
            {navItems
              .filter((item) => !item.roles || item.roles.includes(user.role))
              .map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                        isActive ? "bg-brand text-white" : "text-text hover:bg-white/5"
                      }`
                    }
                  >
                    <Icon size={16} />
                    {item.label}
                  </NavLink>
                );
              })}
          </nav>
        </aside>

        <main className="space-y-4">
          <header className="panel flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="text-sm font-semibold">{user.full_name}</p>
              <p className="text-xs uppercase tracking-wide text-muted">{user.role}</p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
              <button type="button" className="btn-secondary" onClick={logout}>
                <LogOut size={16} className="mr-1" /> Logout
              </button>
            </div>
          </header>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
