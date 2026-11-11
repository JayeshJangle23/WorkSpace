
import { Sun, Moon, LogOut, Search } from "lucide-react";
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
};

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <header className="navbar">
      <div>
        <h2>{titles[location.pathname] || "WorkSpace"}</h2>
        <p>Welcome back, {user?.fullName}</p>
      </div>

      <div className="navbar-actions">
        <div className="search-box">
          <Search size={17} />
          <span>Workspace</span>
        </div>

        <button className="icon-button" onClick={toggleTheme}>
          {theme === "light" ? <Moon /> : <Sun />}
        </button>

        <button className="icon-button" onClick={logout}>
          <LogOut />
        </button>
      </div>
    </header>
  );
}
