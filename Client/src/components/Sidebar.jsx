import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Users, UsersRound, CheckSquare,
  MessageSquare, Bell, Layers, PanelLeftClose, PanelLeft,
} from "lucide-react";

const links = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Users", path: "/users", icon: Users, roles: ["ADMIN"] },
  { name: "Teams", path: "/teams", icon: UsersRound },
  { name: "Tasks", path: "/tasks", icon: CheckSquare },
  { name: "Messages", path: "/messages", icon: MessageSquare },
  { name: "Notifications", path: "/notifications", icon: Bell },
];

export default function Sidebar({ user, collapsed, setCollapsed, onNavClick }) {
  const visible = links.filter(l => !l.roles || l.roles.includes(user?.role));

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.22 }}
      className="flex flex-col h-full md:h-screen flex-shrink-0"
      style={{
        background: "var(--sidebar)",
        borderRight: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
        minWidth: collapsed ? 72 : 260,
        overflow: "hidden",
      }}
    >
      {/* ── Brand ───────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-4 py-5 overflow-hidden flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div
          className="w-9 h-9 rounded-xl grid place-items-center flex-shrink-0"
          style={{ background: "var(--gradient)", color: "#fff", boxShadow: "0 4px 12px rgba(124,58,237,.35)" }}
        >
          <Layers size={20} />
        </div>
        {!collapsed && (
          <span
            className="font-extrabold tracking-tight whitespace-nowrap text-[17px]"
            style={{ fontFamily: "var(--font-heading)", color: "var(--text)" }}
          >
            WorkSpace
          </span>
        )}
      </div>

      {/* ── Collapse toggle — desktop only ──────────────────── */}
      <div className="px-2 pt-3 pb-1 hidden md:block flex-shrink-0">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm transition-colors"
          style={{
            color: "var(--muted)",
            fontFamily: "var(--font-body)",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          {collapsed
            ? <PanelLeft size={17} className="flex-shrink-0" />
            : <PanelLeftClose size={17} className="flex-shrink-0" />}
          {!collapsed && <span className="whitespace-nowrap">Collapse sidebar</span>}
        </button>
      </div>

      {/* ── Nav label ───────────────────────────────────────── */}
      {!collapsed && (
        <p
          className="px-5 py-2 text-[9px] font-bold tracking-widest uppercase flex-shrink-0"
          style={{ color: "var(--muted)" }}
        >
          NAVIGATION
        </p>
      )}

      {/* ── Nav links ───────────────────────────────────────── */}
      <nav className="flex flex-col gap-1 px-2 flex-1 overflow-y-auto py-1">
        {visible.map(({ path, name, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            title={collapsed ? name : ""}
            onClick={onNavClick}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 rounded-xl text-sm font-medium transition-all no-underline",
                collapsed ? "justify-center px-0 py-3" : "px-4 py-3",
                isActive
                  ? "nav-link-active"
                  : "text-muted hover:text-accent"
              ].join(" ")
            }
            style={({ isActive }) => ({
              fontFamily: "var(--font-body)",
              ...(!isActive ? { color: "var(--muted)" } : {}),
            })}
            onMouseEnter={(e) => {
              if (!e.currentTarget.classList.contains("nav-link-active")) {
                e.currentTarget.style.background = "var(--surface-2)";
                e.currentTarget.style.color = "var(--accent)";
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.classList.contains("nav-link-active")) {
                e.currentTarget.style.background = "";
                e.currentTarget.style.color = "var(--muted)";
              }
            }}
          >
            <Icon size={19} className="flex-shrink-0" />
            {!collapsed && <span className="whitespace-nowrap">{name}</span>}
          </NavLink>
        ))}
      </nav>

      {/* ── User footer ─────────────────────────────────────── */}
      {!collapsed && user && (
        <div
          className="flex items-center gap-3 px-4 py-4 flex-shrink-0"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <div
            className="w-9 h-9 rounded-xl grid place-items-center font-bold text-sm flex-shrink-0"
            style={{ background: "var(--accent-soft)", color: "var(--accent)", fontFamily: "var(--font-heading)" }}
          >
            {user.fullName?.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <strong
              className="block truncate text-[13px]"
              style={{ fontFamily: "var(--font-heading)", color: "var(--text)" }}
            >
              {user.fullName}
            </strong>
            <small
              className="block text-[11px] mt-0.5"
              style={{ fontFamily: "var(--font-body)", color: "var(--muted)" }}
            >
              {user.role}
            </small>
          </div>
        </div>
      )}
    </motion.aside>
  );
}
