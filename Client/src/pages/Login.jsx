
// import { useState } from "react";
// import { Navigate,useNavigate } from "react-router-dom";
// import { motion } from "framer-motion";
// import { Layers, Mail, Lock, ArrowRight } from "lucide-react";
// import { useAuth } from "../context/AuthContext";

// export default function Login() {
//   const { login, user, loading:authLoading } = useAuth();
//   const navigate = useNavigate()
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);

//   if (authLoading) {
//     return (
//       <div className="loading-screen">
//         Checking authentication...
//       </div>
//     );
//   }

//   if (user) return <Navigate to="/dashboard" replace />;

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");
//     setLoading(true);

//     try {
//       await login(email, password);
//       navigate("/dashboard",{replace:true})
//     } catch (err) {
//       setError(
//         err.response?.data?.message || "Login failed"
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="login-page">
//       <motion.div
//         className="login-card"
//         initial={{ opacity: 0, y: 30 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.5 }}
//       >
//         <div className="login-logo">
//           <Layers size={28} />
//         </div>

//         <h1>Welcome back</h1>
//         <p>Sign in to your WorkSpace account</p>

//         <form onSubmit={handleSubmit}>
//           <label>Email address</label>
//           <div className="input-wrap">
//             <Mail size={18} />
//             <input
//               type="email"
//               placeholder="admin@example.com"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               required
//             />
//           </div>

//           <label>Password</label>
//           <div className="input-wrap">
//             <Lock size={18} />
//             <input
//               type="password"
//               placeholder="Enter password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               required
//             />
//           </div>

//           {error && <div className="error-message">{error}</div>}

//           <button className="primary-button" disabled={loading}>
//             {loading ? "Signing in..." : "Sign in"}
//             <ArrowRight size={18} />
//           </button>
//         </form>

//         <small>Employee Management Platform</small>
//       </motion.div>
//     </div>
//   );
// }



import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Layers,
  Mail,
  Lock,
  ArrowRight,
} from "lucide-react";

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
      <div className="loading-screen">
        Checking authentication...
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      await login(email.trim(), password);

      navigate("/dashboard", {
        replace: true,
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="login-logo">
          <Layers size={28} />
        </div>

        <h1>Welcome back</h1>
        <p>Sign in to your WorkSpace account</p>

        <form onSubmit={handleSubmit}>
          <label>Email address</label>

          <div className="input-wrap">
            <Mail size={18} />

            <input
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <label>Password</label>

          <div className="input-wrap">
            <Lock size={18} />

            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            className="primary-button"
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}

            <ArrowRight size={18} />
          </button>
        </form>

        <small>Employee Management Platform</small>
      </motion.div>
    </div>
  );
}
