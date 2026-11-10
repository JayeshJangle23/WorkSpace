
import { motion } from "framer-motion";
import {
  UsersRound,
  Users,
  ClipboardList,
  CheckCircle,
  Clock,
  Eye,
  AlertTriangle,
  Layers,
} from "lucide-react";

export default function ManagerDashboard({ data }) {
  const { stats, teams, recentTasks } = data;

  const cards = [
    {
      label: "My Teams",
      value: stats.totalTeams,
      icon: Layers,
      color: "#8877EF",
    },
    {
      label: "Team Members",
      value: stats.totalMembers,
      icon: Users,
      color: "#20B486",
    },
    {
      label: "Total Tasks",
      value: stats.totalTasks,
      icon: ClipboardList,
      color: "#3B82F6",
    },
    {
      label: "Completed Tasks",
      value: stats.completedTasks,
      icon: CheckCircle,
      color: "#10B981",
    },
    {
      label: "In Progress",
      value: stats.inProgressTasks,
      icon: Clock,
      color: "#E7A43B",
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
          <h1>Manager Overview</h1>
          <p>
            Monitor your teams and manage employee tasks.
          </p>
        </div>

        <span className="role-tag">MANAGER</span>
      </div>

      {/* Statistics */}

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

      {/* Teams */}

      <div className="panel">
        <h3>My Teams</h3>
        <p>Teams assigned to your management.</p>

        <div className="team-grid">
          {teams?.length > 0 ? (
            teams.map((team) => (
              <motion.div
                key={team.id}
                className="team-preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <UsersRound size={22} />

                <strong>{team.name}</strong>

                <small>
                  {team.description || "No description"}
                </small>

                <small>
                  {team._count?.members ?? team.members?.length ?? 0}
                  {" "}Members
                </small>
              </motion.div>
            ))
          ) : (
            <p>You don't manage any teams yet.</p>
          )}
        </div>
      </div>

      {/* Recent Tasks */}

      <div className="panel">
        <h3>Recent Tasks</h3>
        <p>Latest tasks from your teams.</p>

        {recentTasks?.length > 0 ? (
          recentTasks.map((task) => (
            <div className="recent-row" key={task.id}>
              <div className="recent-info">
                <strong>{task.title}</strong>

                <small>
                  Team: {task.team?.name || "Unknown"}
                </small>

                <small>
                  Created by:{" "}
                  {task.createdBy?.fullName || "Unknown"}
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

            <h3>No recent tasks</h3>

            <p>
              Tasks created for your teams will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
