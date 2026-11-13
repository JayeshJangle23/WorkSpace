
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Home,
  ArrowLeft,
  SearchX,
  LayoutDashboard,
  MoveRight,
} from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex items-center justify-center p-5"
      style={{
        background: "var(--bg)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="card w-full max-w-xl p-8 sm:p-12 text-center"
      >
        {/* Illustration */}
        <div className="relative flex justify-center mb-6">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="w-28 h-28 rounded-3xl grid place-items-center"
            style={{
              background: "var(--accent-soft)",
              color: "var(--accent)",
            }}
          >
            <SearchX size={55} strokeWidth={1.5} />
          </motion.div>
        </div>

        {/* 404 */}
        <motion.h1
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4 }}
          className="font-heading text-7xl sm:text-8xl font-extrabold m-0"
          style={{
            color: "var(--accent)",
          }}
        >
          404
        </motion.h1>

        <h2
          className="font-heading text-xl sm:text-2xl font-bold mt-4 mb-2"
          style={{ color: "var(--text)" }}
        >
          Oops! Page Not Found
        </h2>

        <p
          className="font-body text-sm leading-6 max-w-sm mx-auto mb-8"
          style={{ color: "var(--muted)" }}
        >
          The page you're looking for doesn't exist,
          may have been moved, or the URL might be incorrect.
          Let's get you back on track.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-center gap-3">

          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
            style={{
              background: "var(--surface-2)",
              color: "var(--text)",
              border: "1px solid var(--border)",
            }}
          >
            <ArrowLeft size={17} />
            Go Back
          </button>

          <Link
            to="/dashboard"
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold no-underline transition-all hover:-translate-y-0.5"
            style={{
              background: "var(--accent)",
              color: "#fff",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <LayoutDashboard size={17} />
            Back to Dashboard
            <MoveRight size={16} />
          </Link>

        </div>

        {/* Footer */}
        <div
          className="mt-10 pt-5 flex items-center justify-center gap-2 text-xs"
          style={{
            borderTop: "1px solid var(--border)",
            color: "var(--muted)",
          }}
        >
          <Home size={14} />
          WorkSpace Management System
        </div>
      </motion.div>
    </div>
  );
}
