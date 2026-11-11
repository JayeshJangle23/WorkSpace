import { useState } from "react";
import {
  BrowserRouter, Routes, Route, Navigate, Outlet, useLocation,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoutes.jsx";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Teams from "./pages/Teams";
import Tasks from "./pages/Tasks";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications.jsx";
import Settings from "./pages/Settings";

function AppLayout() {
  const { user } = useAuth();
  const location = useLocation();

  // Desktop: sidebar can be collapsed to icon-only
  const [collapsed, setCollapsed] = useState(false);
  // Mobile: sidebar is hidden by default, toggled via hamburger
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>

      {/* ── Mobile backdrop overlay ─────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-[25] md:hidden"
            style={{ background: "rgba(10,8,30,.5)", backdropFilter: "blur(2px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMobile}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ────────────────────────────────────────── */}
      {/* Desktop: always visible, collapsible */}
      <div className="hidden md:flex">
        <Sidebar
          user={user}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          onNavClick={() => { }}
        />
      </div>

      {/* Mobile: fixed drawer, slides in from left */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed left-0 top-0 h-full z-[30] md:hidden"
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "tween", duration: 0.25 }}
          >
            <Sidebar
              user={user}
              collapsed={false}
              setCollapsed={() => { }}
              onNavClick={closeMobile}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main content ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          onMenuClick={() => setMobileOpen((o) => !o)}
          mobileOpen={mobileOpen}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            className="flex-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
      />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />

          <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
            <Route path="/users" element={<Users />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
