import { motion } from "framer-motion";
import { ClipboardList, Circle, Clock, CheckCircle, AlertTriangle, Eye } from "lucide-react";

const cards = (s) => [
  { label: "My Tasks", value: s.totalTasks, icon: ClipboardList, color: "#8877EF" },
  { label: "To Do", value: s.todoTasks, icon: Circle, color: "#E7A43B" },
  { label: "In Progress", value: s.inProgressTasks, icon: Clock, color: "#3B82F6" },
  { label: "Completed", value: s.completedTasks, icon: CheckCircle, color: "#20B486" },
  { label: "Pending Reviews", value: s.pendingReviews, icon: Eye, color: "#A855F7" },
  { label: "Overdue Tasks", value: s.overdueTasks, icon: AlertTriangle, color: "#EF4444" },
];

export default function EmployeeDashboard({ data }) {
  const { stats, recentTasks } = data;

  return (
    <div className="page-pad flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-token page-heading-title font-extrabold tracking-tight m-0 mb-1">My Dashboard</h1>
          <p className="font-body text-muted text-sm m-0">Track your assigned tasks and work progress.</p>
        </div>
        <span className="badge badge-role flex-shrink-0">EMPLOYEE</span>
      </div>

      <div className="stats-responsive">
        {cards(stats).map(({ label, value, icon: Icon, color }, i) => (
          <motion.div key={label} className="card p-5 hover:-translate-y-1 transition-transform"
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className="w-10 h-10 grid place-items-center rounded-xl mb-3"
              style={{ background: "var(--accent-soft)", color }}>
              <Icon size={20} />
            </div>
            <p className="text-muted text-[11px] font-semibold uppercase tracking-wide m-0 mb-1">{label}</p>
            <h2 className="font-heading text-token text-3xl font-extrabold m-0 stat-number-mobile">{value ?? 0}</h2>
          </motion.div>
        ))}
      </div>

      <div className="card p-5">
        <h3 className="text-token text-base font-bold mb-1">My Recent Tasks</h3>
        <p className="text-muted text-xs mb-4">Tasks assigned to you recently.</p>
        {recentTasks?.length ? recentTasks.map((task) => (
          <div key={task.id} className="flex items-center gap-3 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex-1 min-w-0">
              <strong className="block text-token text-xs truncate">{task.title}</strong>
              <small className="block text-muted text-[11px]">
                Team: {task.team?.name} · {task.dueDate ? `Due: ${new Date(task.dueDate).toLocaleDateString()}` : ""}
              </small>
            </div>
            <span className="badge badge-role text-[9px]">{task.status}</span>
          </div>
        )) : (
          <div className="flex flex-col items-center gap-3 py-10 text-muted">
            <ClipboardList size={38} style={{ opacity: .4, color: "var(--accent)" }} />
            <p className="text-sm m-0">No tasks assigned yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
