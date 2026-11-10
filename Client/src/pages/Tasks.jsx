
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Trash2,
  CalendarDays,
  RefreshCw,
  ListTodo,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import taskService from "../services/taskService";
import TaskModal from "../components/tasks/TaskModal.jsx";

const statusColors = {
  TODO: "status-todo",
  IN_PROGRESS: "status-progress",
  IN_REVIEW: "status-review",
  COMPLETED: "status-completed",
  BLOCKED: "status-blocked",
};

const priorityColors = {
  LOW: "priority-low",
  MEDIUM: "priority-medium",
  HIGH: "priority-high",
  URGENT: "priority-urgent",
};

const formatDate = (date) => {
  if (!date) return "Not scheduled";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getError = (error) =>
  error.response?.data?.message ||
  error.message ||
  "Something went wrong.";

export default function Tasks() {
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const canManage =
    user?.role === "ADMIN" || user?.role === "MANAGER";

  const canDelete = user?.role === "ADMIN";

  // const fetchTasks = useCallback(async () => {
  //   try {
  //     setLoading(true);
  //     setError("");

  //     const data = await taskService.getTasks();
  //     setTasks(data);
  //   } catch (err) {
  //     setError(getError(err));
  //   } finally {
  //     setLoading(false);
  //   }
  // }, []);

  
const fetchTasks = useCallback(async () => {
  try {
    setLoading(true);
    setError("");

    const response = await taskService.getTasks();

    // Handle different backend response formats
    const taskList = Array.isArray(response)
      ? response
      : Array.isArray(response?.tasks)
        ? response.tasks
        : Array.isArray(response?.data?.tasks)
          ? response.data.tasks
          : [];

    setTasks(taskList);

  } catch (err) {
    console.error("Fetch tasks error:", err);
    setTasks([]);
    setError(getError(err));
  } finally {
    setLoading(false);
  }
}, []);


  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Statistics
  const stats = useMemo(() => ({
    total: tasks.length,
    todo: tasks.filter((t) => t.status === "TODO").length,
    progress: tasks.filter(
      (t) => t.status === "IN_PROGRESS"
    ).length,
    completed: tasks.filter(
      (t) => t.status === "COMPLETED"
    ).length,
  }), [tasks]);

  // Search and filters
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.title?.toLowerCase().includes(search.toLowerCase()) ||
        task.description?.toLowerCase().includes(search.toLowerCase()) ||
        task.team?.name?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" || task.status === statusFilter;

      const matchesPriority =
        priorityFilter === "ALL" ||
        task.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, search, statusFilter, priorityFilter]);

  const openCreateModal = () => {
    setSelectedTask(null);
    setModalOpen(true);
  };

  const openEditModal = (task) => {
    setSelectedTask(task);
    setModalOpen(true);
  };

  const handleSubmit = async (payload) => {
    try {
      setSubmitting(true);

      if (selectedTask) {
        await taskService.updateTask(selectedTask.id, payload);
      } else {
        await taskService.createTask(payload);
      }

      await fetchTasks();
      setModalOpen(false);
      setSelectedTask(null);
      return true;
    } catch (err) {
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (task) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${task.title}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(task.id);
      await taskService.deleteTask(task.id);

      setTasks((prev) =>
        prev.filter((item) => item.id !== task.id)
      );
    } catch (err) {
      window.alert(getError(err));
    } finally {
      setDeletingId(null);
    }
  };

  const statCards = [
    {
      title: "Total Tasks",
      value: stats.total,
      icon: ClipboardList,
      color: "#7966E9",
    },
    {
      title: "To Do",
      value: stats.todo,
      icon: ListTodo,
      color: "#D99B36",
    },
    {
      title: "In Progress",
      value: stats.progress,
      icon: Clock,
      color: "#428BEA",
    },
    {
      title: "Completed",
      value: stats.completed,
      icon: CheckCircle2,
      color: "#25A878",
    },
  ];

  return (
    <div className="page-content tasks-page">

      {/* Header */}
      <div className="page-heading">
        <div>
          <h1>Task Management</h1>
          <p>
            Organize, track and manage your team's tasks.
          </p>
        </div>

        {canManage && (
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            className="primary-button"
            onClick={openCreateModal}
          >
            <Plus size={18} />
            Create Task
          </motion.button>
        )}
      </div>

      {/* Statistics */}
      <div className="stats-grid">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;

          return (
            <motion.div
              key={stat.title}
              className="stat-card"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.07 }}
            >
              <div className="task-stat-top">
                <div className="stat-icon">
                  <Icon size={21} color={stat.color} />
                </div>
              </div>

              <p>{stat.title}</p>
              <h2>{stat.value}</h2>
            </motion.div>
          );
        })}
      </div>

      {/* Task filters */}
      <div className="panel toolbar tasks-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search tasks or teams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Status</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="COMPLETED">Completed</option>
          <option value="BLOCKED">Blocked</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="ALL">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>

        <button
          className="icon-button"
          onClick={fetchTasks}
          title="Refresh tasks"
        >
          <RefreshCw size={17} />
        </button>
      </div>

      {/* Tasks */}
      <div className="panel task-list-panel">
        <div className="table-heading">
          <div>
            <h3>All Tasks</h3>
            <p>
              {filteredTasks.length} tasks found
            </p>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <RefreshCw className="loading-icon" size={25} />
            <p>Loading tasks...</p>
          </div>
        ) : error ? (
          <div className="task-error">
            <AlertCircle size={22} />
            <p>{error}</p>
            <button
              className="primary-button"
              onClick={fetchTasks}
            >
              Try Again
            </button>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="empty-state">
            <ClipboardList size={42} />
            <h3>No tasks found</h3>
            <p>
              {search || statusFilter !== "ALL" ||
              priorityFilter !== "ALL"
                ? "Try changing your search or filters."
                : "Create your first task to get started."}
            </p>

            {canManage && (
              <button
                className="primary-button"
                onClick={openCreateModal}
              >
                <Plus size={16} />
                Create Task
              </button>
            )}
          </div>
        ) : (
          <div className="task-grid">
            <AnimatePresence>
              {filteredTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  className="task-card"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ delay: index * 0.035 }}
                  layout
                >
                  <div className="task-card-header">
                    <div className="task-card-icon">
                      <ClipboardList size={20} />
                    </div>

                    <div className="action-buttons">
                      {canManage && (
                        <button
                          className="icon-button"
                          title="Edit task"
                          onClick={() => openEditModal(task)}
                        >
                          <Pencil size={15} />
                        </button>
                      )}

                      {canDelete && (
                        <button
                          className="icon-button danger"
                          title="Delete task"
                          disabled={deletingId === task.id}
                          onClick={() => handleDelete(task)}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="task-title">
                    {task.title}
                  </h3>

                  <p className="task-description">
                    {task.description || "No description provided."}
                  </p>

                  <div className="task-badges">
                    <span
                      className={`task-badge ${
                        statusColors[task.status] || ""
                      }`}
                    >
                      {(task.status || "TODO").replaceAll("_", " ")}
                    </span>

                    <span
                      className={`task-badge ${
                        priorityColors[task.priority] || ""
                      }`}
                    >
                      {task.priority || "MEDIUM"}
                    </span>
                  </div>

                  <div className="task-details">
                    <div>
                      <span>Team</span>
                      <strong>
                        {task.team?.name || "Team"}
                      </strong>
                    </div>

                    <div>
                      <span>Created By</span>
                      <strong>
                        {task.createdBy?.fullName || "User"}
                      </strong>
                    </div>
                  </div>

                  <div className="task-date">
                    <CalendarDays size={15} />
                    <span>
                      Due: {formatDate(task.dueDate)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <TaskModal
        open={modalOpen}
        onClose={() => {
          if (!submitting) {
            setModalOpen(false);
            setSelectedTask(null);
          }
        }}
        onSubmit={handleSubmit}
        task={selectedTask}
        submitting={submitting}
      />

    </div>
  );
}