
// import { useEffect, useState } from "react";
// import { motion } from "framer-motion";
// import {
//   Users, UsersRound, ShieldCheck, UserCheck,
// } from "lucide-react";
// import {
//   ResponsiveContainer, BarChart, Bar,
//   XAxis, YAxis, Tooltip, CartesianGrid,
// } from "recharts";
// import api from "../api/axios";

// export default function Dashboard() {
//   const [users, setUsers] = useState([]);
//   const [teams, setTeams] = useState([]);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     Promise.all([
//       api.get("/users"),
//       api.get("/teams"),
//     ])
//       .then(([userRes, teamRes]) => {
//         setUsers(userRes.data.users || []);
//         setTeams(teamRes.data.teams || []);
//       })
//       .catch(() => setError("Unable to load dashboard data"));
//   }, []);

//   const activeUsers = users.filter((u) => u.isActive).length;

//   const stats = [
//     { label: "Total Users", value: users.length, icon: Users, color: "#8877EF" },
//     { label: "Active Users", value: activeUsers, icon: UserCheck, color: "#20B486" },
//     { label: "Managers", value: users.filter(u => u.role === "MANAGER").length, icon: ShieldCheck, color: "#E7A43B" },
//     { label: "Total Teams", value: teams.length, icon: UsersRound, color: "#E278B8" },
//   ];

//   const chartData = [
//     { role: "Admins", count: users.filter(u => u.role === "ADMIN").length },
//     { role: "Managers", count: users.filter(u => u.role === "MANAGER").length },
//     { role: "Employees", count: users.filter(u => u.role === "EMPLOYEE").length },
//   ];

//   return (
//     <div className="page-content">
//       <div className="page-heading">
//         <div>
//           <h1>Overview</h1>
//           <p>Here's what's happening in your workspace.</p>
//         </div>
//       </div>

//       {error && <div className="error-message">{error}</div>}

//       <div className="stats-grid">
//         {stats.map((stat, i) => {
//           const Icon = stat.icon;

//           return (
//             <motion.div
//               key={stat.label}
//               className="stat-card"
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: i * 0.1 }}
//             >
//               <div className="stat-icon" style={{ color: stat.color }}>
//                 <Icon size={23} />
//               </div>
//               <p>{stat.label}</p>
//               <h2>{stat.value}</h2>
//             </motion.div>
//           );
//         })}
//       </div>

//       <div className="dashboard-grid">
//         <div className="panel chart-panel">
//           <h3>Users by role</h3>
//           <p>Distribution of workspace members</p>

//           <div className="chart-area">
//             <ResponsiveContainer width="100%" height="100%">
//               <BarChart data={chartData}>
//                 <CartesianGrid strokeDasharray="3 3" vertical={false} />
//                 <XAxis dataKey="role" />
//                 <YAxis allowDecimals={false} />
//                 <Tooltip />
//                 <Bar
//                   dataKey="count"
//                   fill="#8877EF"
//                   radius={[7, 7, 0, 0]}
//                 />
//               </BarChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         <div className="panel">
//           <h3>Recent users</h3>
//           <p>Latest workspace members</p>

//           {users.slice(0, 6).map((user) => (
//             <div className="recent-row" key={user.id}>
//               <div className="avatar">
//                 {user.fullName?.charAt(0)}
//               </div>
//               <div className="recent-info">
//                 <strong>{user.fullName}</strong>
//                 <small>{user.email}</small>
//               </div>
//               <span className="role-tag">{user.role}</span>
//             </div>
//           ))}

//           {users.length === 0 && <p>No users available.</p>}
//         </div>
//       </div>

//       <div className="panel">
//         <h3>Teams overview</h3>
//         <div className="team-grid">
//           {teams.slice(0, 4).map((team) => (
//             <div className="team-preview" key={team.id}>
//               <UsersRound size={22} />
//               <strong>{team.name}</strong>
//               <small>{team.description || "No description"}</small>
//             </div>
//           ))}
//           {teams.length === 0 && <p>No teams created yet.</p>}
//         </div>
//       </div>
//     </div>
//   );
// }


import { useEffect, useState } from "react";
import api from "../api/axios";

import AdminDashboard from "./dashboards/AdminDashboard";
import ManagerDashboard from "./dashboards/ManagerDashboard.jsx";
import EmployeeDashboard from "./dashboards/EmployeeDashboard";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const res = await api.get("/dashboard");
        setData(res.data);
      } catch (err) {
        setError(
          err.response?.data?.message ||
          "Unable to load dashboard"
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!data) return null;

  switch (data.role) {
    case "ADMIN":
      return <AdminDashboard data={data} />;

    case "MANAGER":
      return <ManagerDashboard data={data} />;

    case "EMPLOYEE":
      return <EmployeeDashboard data={data} />;

    default:
      return <div>Unauthorized role</div>;
  }
}
