import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, ClipboardList, Clock, CheckCircle2,
  AlertCircle, Pencil, Trash2, CalendarDays, RefreshCw,
  ListTodo, Eye,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import taskService from "../services/taskService";
import TaskModal from "../components/tasks/TaskModal.jsx";
import TaskDetailModal from "../components/tasks/TaskDetailModal.jsx";

const statusBadge = {
  TODO: "badge badge-todo",
  IN_PROGRESS: "badge badge-progress",
  IN_REVIEW: "badge badge-review",
  COMPLETED: "badge badge-done",
  BLOCKED: "badge badge-blocked",
};

const priorityBadge = {
  LOW: "badge badge-low",
  MEDIUM: "badge badge-medium",
  HIGH: "badge badge-high",
  URGENT: "badge badge-urgent",
};

const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "Not scheduled";

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [prioFilter, setPrioFilter] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [detailTaskId, setDetailTaskId] = useState(null);

  const isAdmin = user?.role === "ADMIN";
  const isManager = user?.role === "MANAGER";
  const canManage = isAdmin || isManager;

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true); setError("");
      const res = await taskService.getTasks();
      const list = Array.isArray(res) ? res : Array.isArray(res?.tasks) ? res.tasks : [];
      setTasks(list);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load tasks");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const stats = useMemo(() => ({
    total: tasks.length,
    todo: tasks.filter(t => t.status === "TODO").length,
    progress: tasks.filter(t => t.status === "IN_PROGRESS").length,
    completed: tasks.filter(t => t.status === "COMPLETED").length,
  }), [tasks]);

  const filtered = useMemo(() => tasks.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = t.title?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) || t.team?.name?.toLowerCase().includes(q);
    return matchSearch &&
      (statusFilter === "ALL" || t.status === statusFilter) &&
      (prioFilter === "ALL" || t.priority === prioFilter);
  }), [tasks, search, statusFilter, prioFilter]);

  const handleSubmit = async (payload) => {
    try {
      setSubmitting(true);
      selectedTask
        ? await taskService.updateTask(selectedTask.id, payload)
        : await taskService.createTask(payload);
      await fetchTasks(); setModalOpen(false); setSelectedTask(null);
      return true;
    } catch (err) { throw err; }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    try {
      setDeletingId(task.id);
      await taskService.deleteTask(task.id);
      setTasks(p => p.filter(t => t.id !== task.id));
    } catch (err) { window.alert(err.response?.data?.message || "Failed to delete"); }
    finally { setDeletingId(null); }
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      setUpdatingStatus(taskId);
      await taskService.updateTaskStatus(taskId, status);
      await fetchTasks();
    } catch (err) { window.alert(err.response?.data?.message || "Failed"); }
    finally { setUpdatingStatus(null); }
  };

  const statCards = [
    { label: "Total Tasks", value: stats.total, icon: ClipboardList, color: "#7C3AED" },
    { label: "To Do", value: stats.todo, icon: ListTodo, color: "#D97706" },
    { label: "In Progress", value: stats.progress, icon: Clock, color: "#2563EB" },
    { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "#059669" },
  ];

  return (
    <div className="page-pad flex flex-col gap-6">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-token text-2xl font-extrabold tracking-tight m-0 mb-1">Task Management</h1>
          <p className="font-body text-muted text-sm m-0">Organize, track and manage your team's tasks.</p>
        </div>
        {canManage && (
          <motion.button
            whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}
            className="btn-primary"
            onClick={() => { setSelectedTask(null); setModalOpen(true); }}
          >
            <Plus size={17} /> Create Task
          </motion.button>
        )}
      </div>

      {/* ── Stat cards ─────────────────────────────────────────── */}
      <div className="stats-responsive">
        {statCards.map(({ label, value, icon: Icon, color }, i) => (
          <motion.div key={label} className="card p-5 hover:-translate-y-1 transition-transform"
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <div className="w-10 h-10 rounded-xl grid place-items-center mb-3"
              style={{ background: "var(--accent-soft)", color }}>
              <Icon size={20} />
            </div>
            <p className="text-muted text-[11px] font-semibold uppercase tracking-wide m-0 mb-1">{label}</p>
            <h2 className="font-heading text-token text-3xl font-extrabold m-0">{value}</h2>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="card flex flex-wrap items-center gap-3 p-3 filters-mobile">
        <div className="flex items-center gap-2 flex-1 min-w-0 px-3 py-2 rounded-xl bg-surface-2 filter-search"
          style={{ border: "1px solid var(--border)" }}>
          <Search size={15} className="text-muted flex-shrink-0" />
          <input className="flex-1 bg-transparent outline-none text-sm text-token"
            placeholder="Search tasks or teams…" value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="field w-auto text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="ALL">All Status</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="COMPLETED">Completed</option>
          <option value="BLOCKED">Blocked</option>
        </select>
        <select className="field w-auto text-sm" value={prioFilter} onChange={e => setPrioFilter(e.target.value)}>
          <option value="ALL">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
        <button className="btn-icon" onClick={fetchTasks} title="Refresh">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* ── Task grid ──────────────────────────────────────────── */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-token text-base font-bold m-0">All Tasks</h3>
            <p className="text-muted text-xs mt-1">{filtered.length} tasks found</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-3 py-16 text-muted">
            <RefreshCw size={26} className="spin" style={{ color: "var(--accent)" }} />
            <p className="text-sm">Loading tasks…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-14" style={{ color: "var(--danger)" }}>
            <AlertCircle size={26} />
            <p className="text-sm">{error}</p>
            <button className="btn-primary text-xs" onClick={fetchTasks}>Try Again</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-14 text-muted">
            <ClipboardList size={42} style={{ opacity: .4, color: "var(--accent)" }} />
            <h3 className="text-token text-base m-0">No tasks found</h3>
            <p className="text-sm text-center max-w-xs">
              {search || statusFilter !== "ALL" || prioFilter !== "ALL"
                ? "Try changing your search or filters."
                : "Create your first task to get started."}
            </p>
            {canManage && (
              <button className="btn-primary text-xs" onClick={() => { setSelectedTask(null); setModalOpen(true); }}>
                <Plus size={15} /> Create Task
              </button>
            )}
          </div>
        ) : (
          <div className="tasks-responsive">
            <AnimatePresence>
              {filtered.map((task, i) => (
                <motion.div
                  key={task.id}
                  className="card p-5 flex flex-col gap-3 hover:-translate-y-1 transition-transform"
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.03 }}
                  layout
                >
                  {/* Card header */}
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl grid place-items-center"
                      style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                      <ClipboardList size={19} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button className="btn-icon" title="View" onClick={() => setDetailTaskId(task.id)}>
                        <Eye size={14} />
                      </button>
                      {canManage && (
                        <button className="btn-icon" title="Edit"
                          onClick={() => { setSelectedTask(task); setModalOpen(true); }}>
                          <Pencil size={14} />
                        </button>
                      )}
                      {isAdmin && (
                        <button className="btn-icon danger" title="Delete"
                          disabled={deletingId === task.id} onClick={() => handleDelete(task)}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Title + description */}
                  <h3 className="text-token text-[15px] font-bold leading-snug m-0">{task.title}</h3>
                  <p className="text-muted text-xs leading-relaxed m-0 line-clamp-2">
                    {task.description || "No description provided."}
                  </p>

                  {/* Status + priority badges */}
                  <div className="flex flex-wrap gap-1.5">
                    <span className={statusBadge[task.status] || "badge badge-todo"}>
                      {(task.status || "TODO").replaceAll("_", " ")}
                    </span>
                    <span className={priorityBadge[task.priority] || "badge badge-medium"}>
                      {task.priority || "MEDIUM"}
                    </span>
                  </div>

                  {/* Meta */}
                  <div className="flex flex-col gap-2 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted">Team</span>
                      <strong className="text-token truncate max-w-[55%]">{task.team?.name || "—"}</strong>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted">Created By</span>
                      <strong className="text-token truncate max-w-[55%]">{task.createdBy?.fullName || "—"}</strong>
                    </div>
                    {task.assignments?.length > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted">Assigned To</span>
                        <strong className="text-token truncate max-w-[55%]">
                          {task.assignments.map(a => a.user?.fullName).join(", ")}
                        </strong>
                      </div>
                    )}

                    {/* Status update */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted">Update Status</span>
                      <select
                        className="field py-1 px-2 text-[11px] w-auto"
                        value={task.status}
                        onChange={e => handleStatusChange(task.id, e.target.value)}
                        disabled={updatingStatus === task.id}
                      >
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="IN_REVIEW">In Review</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="BLOCKED">Blocked</option>
                      </select>
                    </div>
                  </div>

                  {/* Due date */}
                  <div className="flex items-center gap-1.5 text-xs font-medium pt-1"
                    style={{ color: "var(--accent-light)" }}>
                    <CalendarDays size={13} />
                    <span>Due: {fmt(task.dueDate)}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <TaskModal
        open={modalOpen}
        onClose={() => { if (!submitting) { setModalOpen(false); setSelectedTask(null); } }}
        onSubmit={handleSubmit}
        task={selectedTask}
        loading={submitting}
      />

      <TaskDetailModal
        open={!!detailTaskId}
        onClose={() => setDetailTaskId(null)}
        taskId={detailTaskId}
        onUpdated={fetchTasks}
      />
    </div>
  );
}
