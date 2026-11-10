
import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
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
  const [collapsed, setCollapsed] = useState(false);

  const location = useLocation();

  return (
    <div className="app-layout">
      <Sidebar
        user={user}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <main className="main-content">
        <Navbar />

        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
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

          <Route
            element={
              <ProtectedRoute roles={["ADMIN"]} />
            }
          >
            <Route path="/users" element={<Users />} />
          </Route>

          <Route path="/teams" element={<Teams />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />

      <Route
        path="*"
        element={<Navigate to="/dashboard" replace />}
      />
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
