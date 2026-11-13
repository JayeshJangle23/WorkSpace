import { Menu, X, Sun, Moon, LogOut, Search } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "react-router-dom";

const titles = {
  "/dashboard": "Dashboard",
  "/users": "User Management",
  "/teams": "Team Management",
  "/tasks": "Task Management",
  "/messages": "Messages",
  "/notifications": "Notifications",
  "/settings": "Settings",
};

export default function Navbar({ onMenuClick, mobileOpen }) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <header
      className="sticky top-0 z-[5] flex items-center justify-between gap-3 px-4 md:px-6 min-h-[64px]"
      style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          className="hidden md:invisible flex-shrink-0 btn-icon"
          onClick={onMenuClick}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        <div className="min-w-0 md:ml-[-50px]">
          <h2
            className="text-token truncate font-bold tracking-tight"
            style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(14px, 3vw, 18px)" }}
          >
            {titles[location.pathname] || "WorkSpace"}
          </h2>
          <p
            className="text-muted text-xs mt-0.5 hidden sm:block truncate"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Welcome back, {user?.fullName}
          </p>
        </div>
      </div>

      {}
      <div className="flex items-center gap-2 flex-shrink-0">
        {}
        <div
          className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl text-muted text-sm"
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            fontFamily: "var(--font-body)",
          }}
        >
          <Search size={15} />
          <span>Search…</span>
        </div>

        <button className="btn-icon" onClick={toggleTheme} title="Toggle theme">
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <button className="btn-icon danger" onClick={logout} title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
