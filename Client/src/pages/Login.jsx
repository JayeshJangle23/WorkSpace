import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Layers, Mail, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-bg text-accent font-bold">
        Checking authentication…
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg min-h-screen grid place-items-center p-5">
      <motion.div
        className="card w-full max-w-[420px] p-9"
        style={{ boxShadow: "var(--shadow-lg)" }}
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        {/* Logo */}
        <div className="brand-icon-grad w-12 h-12 rounded-xl grid place-items-center mb-6">
          <Layers size={26} />
        </div>

        <h1 className="font-heading text-token text-2xl font-extrabold tracking-tight mb-1">
          Welcome back
        </h1>
        <p className="font-body text-muted text-sm mb-7">Sign in to your WorkSpace account</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold" style={{ color: "var(--text-2)" }}>
              Email address
            </label>
            <div
              className="bg-surface-2 border-token flex items-center gap-2.5 px-3 rounded-xl transition-all"
              style={{ border: "1.5px solid var(--border)" }}
            >
              <Mail size={16} className="text-muted flex-shrink-0" />
              <input
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
                className="flex-1 min-w-0 py-2.5 bg-transparent outline-none text-sm text-token"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold" style={{ color: "var(--text-2)" }}>
              Password
            </label>
            <div
              className="bg-surface-2 border-token flex items-center gap-2.5 px-3 rounded-xl transition-all"
              style={{ border: "1.5px solid var(--border)" }}
            >
              <Lock size={16} className="text-muted flex-shrink-0" />
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="flex-1 min-w-0 py-2.5 bg-transparent outline-none text-sm text-token"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm px-3 py-2.5 rounded-lg" style={{ color: "var(--danger)", background: "var(--danger-bg)" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-1 justify-center"
          >
            {loading ? "Signing in…" : "Sign in"}
            <ArrowRight size={17} />
          </button>
        </form>

        <p className="font-body text-muted text-xs text-center mt-6">
          Employee Management Platform
        </p>
      </motion.div>
    </div>
  );
}
