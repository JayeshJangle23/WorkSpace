import { motion } from "framer-motion";
import {
  Users, UserCheck, ShieldCheck, UsersRound,
  CheckSquare, Clock, ClipboardCheck,
} from "lucide-react";

const cards = (s) => [
  { label: "Total Users", value: s.totalUsers, icon: Users, color: "#8877EF" },
  { label: "Active Users", value: s.activeUsers, icon: UserCheck, color: "#20B486" },
  { label: "Managers", value: s.totalManagers, icon: ShieldCheck, color: "#E7A43B" },
  { label: "Employees", value: s.totalEmployees, icon: UsersRound, color: "#E278B8" },
  { label: "Total Teams", value: s.totalTeams, icon: UsersRound, color: "#3B82F6" },
  { label: "Total Tasks", value: s.totalTasks, icon: CheckSquare, color: "#14B8A6" },
  { label: "Completed Tasks", value: s.completedTasks, icon: ClipboardCheck, color: "#10B981" },
  { label: "Pending Reviews", value: s.pendingReviews, icon: Clock, color: "#F59E0B" },
];

export default function AdminDashboard({ data }) {
  const { stats, recentUsers, recentTasks } = data;

  return (
    <div className="page-pad flex flex-col gap-6">
      {/* Heading */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-token page-heading-title font-extrabold tracking-tight m-0 mb-1">Admin Overview</h1>
          <p className="font-body text-muted text-sm m-0">Manage your entire workspace from one place.</p>
        </div>
        <span className="badge badge-role flex-shrink-0">ADMIN</span>
      </div>

      {/* Stats */}
      <div className="stats-responsive">
        {cards(stats).map(({ label, value, icon: Icon, color }, i) => (
          <motion.div
            key={label}
            className="card p-5 hover:-translate-y-1 transition-transform"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div
              className="w-10 h-10 grid place-items-center rounded-xl mb-3"
              style={{ background: "var(--accent-soft)", color }}
            >
              <Icon size={20} />
            </div>
            <p className="text-muted text-[11px] font-semibold uppercase tracking-wide m-0 mb-1">{label}</p>
            <h2 className="font-heading text-token text-3xl font-extrabold m-0 stat-number-mobile">{value ?? 0}</h2>
          </motion.div>
        ))}
      </div>

      {/* Recent panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Recent users */}
        <div className="card p-5">
          <h3 className="text-token text-base font-bold mb-1">Recent Users</h3>
          <p className="text-muted text-xs mb-4">Recently registered workspace members.</p>
          {recentUsers?.length ? recentUsers.map((u) => (
            <div key={u.id} className="flex items-center gap-3 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="w-9 h-9 rounded-xl grid place-items-center font-bold text-sm flex-shrink-0"
                style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                {u.fullName?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <strong className="block font-heading text-token text-xs truncate">{u.fullName}</strong>
                <small className="block font-body text-muted text-[11px]">{u.email}</small>
              </div>
              <span className="badge badge-role">{u.role}</span>
            </div>
          )) : <p className="text-muted text-sm">No recent users.</p>}
        </div>

        {/* Recent tasks */}
        <div className="card p-5">
          <h3 className="text-token text-base font-bold mb-1">Recent Tasks</h3>
          <p className="text-muted text-xs mb-4">Latest workspace tasks.</p>
          {recentTasks?.length ? recentTasks.map((t) => (
            <div key={t.id} className="flex items-center gap-3 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex-1 min-w-0">
                <strong className="block text-token text-xs truncate">{t.title}</strong>
                <small className="block text-muted text-[11px] mt-0.5">
                  {t.team?.name} · {t.createdBy?.fullName}
                </small>
              </div>
              <span className="badge badge-role text-[9px]">{t.status}</span>
            </div>
          )) : <p className="text-muted text-sm">No recent tasks.</p>}
        </div>
      </div>
    </div>
  );
}
