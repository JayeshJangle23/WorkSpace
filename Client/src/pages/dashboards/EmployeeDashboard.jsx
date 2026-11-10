import { motion } from "framer-motion";
import {
  ClipboardList,
  Circle,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
} from "lucide-react";

export default function EmployeeDashboard({ data }) {
  const { stats, recentTasks } = data;

  const cards = [
    {
      label: "My Tasks",
      value: stats.totalTasks,
      icon: ClipboardList,
      color: "#8877EF",
    },
    {
      label: "To Do",
      value: stats.todoTasks,
      icon: Circle,
      color: "#E7A43B",
    },
    {
      label: "In Progress",
      value: stats.inProgressTasks,
      icon: Clock,
      color: "#3B82F6",
    },
    {
      label: "Completed",
      value: stats.completedTasks,
      icon: CheckCircle,
      color: "#20B486",
    },
    {
      label: "Pending Reviews",
      value: stats.pendingReviews,
      icon: Eye,
      color: "#A855F7",
    },
    {
      label: "Overdue Tasks",
      value: stats.overdueTasks,
      icon: AlertTriangle,
      color: "#EF4444",
    },
  ];

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <h1>My Dashboard</h1>
          <p>
            Track your assigned tasks and work progress.
          </p>
        </div>

        <span className="role-tag">EMPLOYEE</span>
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

      <div className="panel">
        <h3>My Recent Tasks</h3>
        <p>Tasks assigned to you recently.</p>

        {recentTasks?.length > 0 ? (
          recentTasks.map((task) => (
            <div className="recent-row" key={task.id}>
              <div className="recent-info">
                <strong>{task.title}</strong>

                <small>
                  {task.description || "No description"}
                </small>

                <small>
                  Team: {task.team?.name || "Not available"}
                </small>

                {task.dueDate && (
                  <small>
                    Due:{" "}
                    {new Date(task.dueDate).toLocaleDateString()}
                  </small>
                )}
              </div>

              <span className="role-tag">
                {task.status}
              </span>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <ClipboardList size={42} />
            <h3>No tasks assigned yet</h3>
            <p>
              Your assigned tasks will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}