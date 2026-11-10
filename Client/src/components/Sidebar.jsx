
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  UsersRound,
  CheckSquare,
  MessageSquare,
  Bell,
  Settings,
  Layers,
  PanelLeftClose,
} from "lucide-react";

const links = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Users", path: "/users", icon: Users, roles: ["ADMIN"] },
  { name: "Teams", path: "/teams", icon: UsersRound },
  { name: "Tasks", path: "/tasks", icon: CheckSquare },
  { name: "Messages", path: "/messages", icon: MessageSquare },
  { name: "Notifications", path: "/notifications", icon: Bell },
  { name: "Settings", path: "/settings", icon: Settings },
];

export default function Sidebar({ user, collapsed, setCollapsed }) {
  const visibleLinks = links.filter(
    (link) => !link.roles || link.roles.includes(user?.role)
  );

  return (
    <motion.aside
      animate={{ width: collapsed ? 82 : 250 }}
      transition={{ duration: 0.25 }}
      className="sidebar"
    >
      <div className="brand">
        <div className="brand-icon"><Layers size={23} /></div>
        {!collapsed && <span>WorkSpace</span>}
      </div>

      <button
        className="collapse-button"
        onClick={() => setCollapsed(!collapsed)}
      >
        <PanelLeftClose size={18} />
        {!collapsed && "Collapse sidebar"}
      </button>

      <p className="nav-label">
        {!collapsed && "WORKSPACE"}
      </p>

      <nav>
        {visibleLinks.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={collapsed ? item.name : ""}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <Icon size={20} />
              {!collapsed && <span>{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="sidebar-footer">
          <div className="sidebar-avatar">
            {user?.fullName?.charAt(0)}
          </div>
          <div>
            <strong>{user?.fullName}</strong>
            <small>{user?.role}</small>
          </div>
        </div>
      )}
    </motion.aside>
  );
}
