import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ClipboardList, UserCheck } from "lucide-react";
import api from "../../api/axios";
import taskService from "../../services/taskService";

const initialForm = {
  title: "",
  description: "",
  teamId: "",
  priority: "MEDIUM",
  startDate: "",
  dueDate: "",
};

export default function TaskModal({
  open,
  onClose,
  onSubmit,
  task,
  loading,
}) {
  const [form, setForm] = useState(initialForm);
  const [teams, setTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch all teams when modal opens
  useEffect(() => {
    if (!open) return;

    const fetchTeams = async () => {
      try {
        setTeamsLoading(true);
        const response = await api.get("/teams");
        setTeams(response.data.teams || []);
      } catch (err) {
        console.error("Fetch teams error:", err);
        setError("Unable to fetch teams. Please try again.");
      } finally {
        setTeamsLoading(false);
      }
    };

    fetchTeams();
  }, [open]);

  // Fetch team members when a team is selected
  useEffect(() => {
    if (!form.teamId) {
      setTeamMembers([]);
      setSelectedAssignees([]);
      return;
    }

    const fetchMembers = async () => {
      try {
        setMembersLoading(true);
        const data = await taskService.getTeamMembers(form.teamId);
        setTeamMembers(data.members || []);
      } catch {
        // EMPLOYEE won't have access — silently ignore
        setTeamMembers([]);
      } finally {
        setMembersLoading(false);
      }
    };

    fetchMembers();
  }, [form.teamId]);

  // Initialize form when modal opens or task changes
  useEffect(() => {
    if (!open) return;

    setError("");

    if (task) {
      setForm({
        title: task.title || "",
        description: task.description || "",
        teamId: task.teamId || "",
        priority: task.priority || "MEDIUM",
        startDate: task.startDate
          ? task.startDate.slice(0, 10)
          : "",
        dueDate: task.dueDate
          ? task.dueDate.slice(0, 10)
          : "",
      });
      // Pre-populate assignees from existing task
      setSelectedAssignees(
        task.assignments?.map((a) => a.user?.id || a.userId) || [],
      );
    } else {
      setForm(initialForm);
      setSelectedAssignees([]);
    }
  }, [open, task]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleAssignee = (userId) => {
    setSelectedAssignees((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.title.trim() || !form.teamId) {
      setError("Task title and team are required.");
      return;
    }

    if (form.startDate && form.dueDate && form.dueDate < form.startDate) {
      setError("Due date cannot be before start date.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      teamId: form.teamId,
      priority: form.priority,
      startDate: form.startDate
        ? new Date(`${form.startDate}T00:00:00`).toISOString()
        : null,
      dueDate: form.dueDate
        ? new Date(`${form.dueDate}T23:59:59`).toISOString()
        : null,
      assigneeIds: selectedAssignees,
    };

    const success = await onSubmit(payload);

    if (!success) {
      setError("Unable to save task. Please check the details.");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="task-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            className="task-modal"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.22 }}
          >
            <div className="task-modal-header">
              <div className="task-modal-title">
                <div className="task-modal-icon">
                  <ClipboardList size={21} />
                </div>
                <div>
                  <h2>{task ? "Edit Task" : "Create New Task"}</h2>
                  <p>
                    {task
                      ? "Update your task details"
                      : "Add a new task to your workspace"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="task-icon-button"
                onClick={onClose}
                disabled={loading}
                aria-label="Close modal"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="task-form-grid">
                {/* Title */}
                <div className="task-form-field full">
                  <label>Task Title *</label>
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Enter task title"
                    required
                    maxLength={150}
                  />
                </div>

                {/* Description */}
                <div className="task-form-field full">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Describe your task..."
                    rows={4}
                  />
                </div>

                {/* Team dropdown */}
                <div className="task-form-field full">
                  <label>Select Team *</label>
                  <select
                    name="teamId"
                    value={form.teamId}
                    onChange={handleChange}
                    required
                    disabled={teamsLoading || teams.length === 0}
                  >
                    <option value="">
                      {teamsLoading
                        ? "Loading teams..."
                        : teams.length === 0
                          ? "No teams available"
                          : "Select a team"}
                    </option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Assignee checkboxes */}
                {form.teamId && (
                  <div className="task-form-field full">
                    <label>
                      <UserCheck size={14} style={{ display: "inline", marginRight: 4 }} />
                      Assign To (select one or more team members)
                    </label>

                    {membersLoading ? (
                      <small>Loading team members...</small>
                    ) : teamMembers.length === 0 ? (
                      <small>No members in this team. Add members first.</small>
                    ) : (
                      <div
                        className="assignee-list"
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                          maxHeight: "160px",
                          overflowY: "auto",
                          padding: "8px",
                          border: "1px solid var(--border-color, #e2e2e2)",
                          borderRadius: "8px",
                        }}
                      >
                        {teamMembers.map((member) => (
                          <label
                            key={member.id}
                            className="assignee-item"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              cursor: "pointer",
                              padding: "4px 6px",
                              borderRadius: "6px",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedAssignees.includes(member.id)}
                              onChange={() => toggleAssignee(member.id)}
                              style={{ cursor: "pointer" }}
                            />
                            <span>{member.fullName}</span>
                            <small style={{ opacity: 0.6 }}>
                              {member.email}
                            </small>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Priority */}
                <div className="task-form-field">
                  <label>Priority</label>
                  <select
                    name="priority"
                    value={form.priority}
                    onChange={handleChange}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                {/* Start Date */}
                <div className="task-form-field">
                  <label>Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={form.startDate}
                    onChange={handleChange}
                  />
                </div>

                {/* Due Date */}
                <div className="task-form-field full">
                  <label>Due Date</label>
                  <input
                    type="date"
                    name="dueDate"
                    value={form.dueDate}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {error && (
                <div className="task-form-error">{error}</div>
              )}

              <div className="task-modal-actions">
                <button
                  type="button"
                  className="task-secondary-button"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="task-primary-button"
                  disabled={loading || teamsLoading || teams.length === 0}
                >
                  {loading
                    ? "Saving..."
                    : task
                      ? "Save Changes"
                      : "Create Task"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
