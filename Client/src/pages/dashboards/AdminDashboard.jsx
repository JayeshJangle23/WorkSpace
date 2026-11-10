
import { motion } from "framer-motion";
import {
  Users,
  UserCheck,
  ShieldCheck,
  UsersRound,
  CheckSquare,
  Clock,
  ClipboardCheck,
} from "lucide-react";

export default function AdminDashboard({ data }) {
  const { stats, recentUsers, recentTasks } = data;

  const cards = [
    {
      label: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "#8877EF",
    },
    {
      label: "Active Users",
      value: stats.activeUsers,
      icon: UserCheck,
      color: "#20B486",
    },
    {
      label: "Managers",
      value: stats.totalManagers,
      icon: ShieldCheck,
      color: "#E7A43B",
    },
    {
      label: "Employees",
      value: stats.totalEmployees,
      icon: UsersRound,
      color: "#E278B8",
    },
    {
      label: "Total Teams",
      value: stats.totalTeams,
      icon: UsersRound,
      color: "#3B82F6",
    },
    {
      label: "Total Tasks",
      value: stats.totalTasks,
      icon: CheckSquare,
      color: "#14B8A6",
    },
    {
      label: "Completed Tasks",
      value: stats.completedTasks,
      icon: ClipboardCheck,
      color: "#10B981",
    },
    {
      label: "Pending Reviews",
      value: stats.pendingReviews,
      icon: Clock,
      color: "#F59E0B",
    },
  ];

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <h1>Admin Overview</h1>
          <p>
            Manage your entire workspace from one place.
          </p>
        </div>
        <span className="role-tag">ADMIN</span>
      </div>

      <div className="stats-grid">
        {cards.map((card, index) => {
          const Icon = card.icon;

          return (
            <motion.div
              key={card.label}
              className="stat-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div
                className="stat-icon"
                style={{ color: card.color }}
              >
                <Icon size={23} />
              </div>

              <p>{card.label}</p>
              <h2>{card.value ?? 0}</h2>
            </motion.div>
          );
        })}
      </div>

      <div className="dashboard-grid">
        <div className="panel">
          <h3>Recent Users</h3>
          <p>Recently registered workspace members.</p>

          {recentUsers?.map((user) => (
            <div className="recent-row" key={user.id}>
              <div className="avatar">
                {user.fullName?.charAt(0)}
              </div>

              <div className="recent-info">
                <strong>{user.fullName}</strong>
                <small>{user.email}</small>
              </div>

              <span className="role-tag">
                {user.role}
              </span>
            </div>
          ))}

          {!recentUsers?.length && (
            <p>No recent users.</p>
          )}
        </div>

        <div className="panel">
          <h3>Recent Tasks</h3>
          <p>Latest workspace tasks.</p>

          {recentTasks?.map((task) => (
            <div className="recent-row" key={task.id}>
              <div className="recent-info">
                <strong>{task.title}</strong>
                <small>
                  {task.team?.name || "No team"} ·{" "}
                  {task.createdBy?.fullName || "Unknown"}
                </small>
              </div>

              <span className="role-tag">
                {task.status}
              </span>
            </div>
          ))}

          {!recentTasks?.length && (
            <p>No recent tasks.</p>
          )}
        </div>
      </div>
    </div>
  );
}
