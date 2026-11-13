import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ClipboardList, UserCheck } from "lucide-react";
import api from "../../api/axios";
import taskService from "../../services/taskService";

const initialForm = { title: "", description: "", teamId: "", priority: "MEDIUM", startDate: "", dueDate: "" };

export default function TaskModal({ open, onClose, onSubmit, task, loading }) {
  const [form, setForm]                     = useState(initialForm);
  const [teams, setTeams]                   = useState([]);
  const [teamsLoading, setTeamsLoading]     = useState(false);
  const [teamMembers, setTeamMembers]       = useState([]);
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [error, setError]                   = useState("");

  useEffect(() => {
    if (!open) return;
    setTeamsLoading(true);
    api.get("/teams")
      .then((r) => setTeams(r.data.teams || []))
      .catch(() => setError("Unable to fetch teams."))
      .finally(() => setTeamsLoading(false));
  }, [open]);

  useEffect(() => {
    if (!form.teamId) { setTeamMembers([]); setSelectedAssignees([]); return; }
    setMembersLoading(true);
    taskService.getTeamMembers(form.teamId)
      .then((d) => setTeamMembers(d.members || []))
      .catch(() => setTeamMembers([]))
      .finally(() => setMembersLoading(false));
  }, [form.teamId]);

  useEffect(() => {
    if (!open) return;
    setError("");
    if (task) {
      setForm({
        title: task.title || "", description: task.description || "",
        teamId: task.teamId || "", priority: task.priority || "MEDIUM",
        startDate: task.startDate ? task.startDate.slice(0, 10) : "",
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
      });
      setSelectedAssignees(task.assignments?.map((a) => a.user?.id || a.userId) || []);
    } else { setForm(initialForm); setSelectedAssignees([]); }
  }, [open, task]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const toggleAssignee = (id: string) =>
    setSelectedAssignees((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (!form.title.trim() || !form.teamId) return setError("Title and team are required.");
    if (form.startDate && form.dueDate && form.dueDate < form.startDate) return setError("Due date cannot be before start date.");
    const payload = {
      title: form.title.trim(), description: form.description.trim(), teamId: form.teamId,
      priority: form.priority,
      startDate: form.startDate ? new Date(`${form.startDate}T00:00:00`).toISOString() : null,
      dueDate:   form.dueDate   ? new Date(`${form.dueDate}T23:59:59`).toISOString()   : null,
      assigneeIds: selectedAssignees,
    };
    const ok = await onSubmit(payload);
    if (!ok) setError("Unable to save task.");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-backdrop-bg fixed inset-0 grid place-items-center p-5 z-[120] overflow-y-auto"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            className="card w-full max-w-[560px] max-h-[90dvh] overflow-y-auto p-5 md:p-7 modal-mobile-full"
            style={{ boxShadow: "var(--shadow-lg)" }}
            initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.22 }}
          >
            {}
            <div className="flex items-start justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl grid place-items-center flex-shrink-0"
                  style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                  <ClipboardList size={21} />
                </div>
                <div>
                  <h2 className="text-token text-base font-bold m-0">{task ? "Edit Task" : "Create New Task"}</h2>
                  <p className="text-muted text-xs mt-1">{task ? "Update your task details" : "Add a new task to your workspace"}</p>
                </div>
              </div>
              <button className="btn-icon" onClick={onClose} disabled={loading} aria-label="Close"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {}
              <div className="col-span-2 sm:col-span-2 flex flex-col gap-1.5">
                  <label className="text-xs font-bold" style={{ color: "var(--text-2)" }}>Task Title *</label>
                  <input className="field" name="title" value={form.title} onChange={handleChange} placeholder="Enter task title" required maxLength={150} />
                </div>

                {}
                <div className="col-span-2 flex flex-col gap-1.5">
                  <label className="text-xs font-bold" style={{ color: "var(--text-2)" }}>Description</label>
                  <textarea className="field min-h-[80px] resize-y" name="description" value={form.description} onChange={handleChange} placeholder="Describe your task…" rows={3} />
                </div>

                {}
                <div className="col-span-2 flex flex-col gap-1.5">
                  <label className="text-xs font-bold" style={{ color: "var(--text-2)" }}>Select Team *</label>
                  <select className="field" name="teamId" value={form.teamId} onChange={handleChange} required disabled={teamsLoading || teams.length === 0}>
                    <option value="">{teamsLoading ? "Loading…" : teams.length === 0 ? "No teams" : "Select a team"}</option>
                    {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>

                {}
                {form.teamId && (
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <label className="text-xs font-bold flex items-center gap-1" style={{ color: "var(--text-2)" }}>
                      <UserCheck size={13} /> Assign To
                    </label>
                    {membersLoading ? (
                      <small className="text-muted text-xs">Loading members…</small>
                    ) : teamMembers.length === 0 ? (
                      <small className="text-muted text-xs">No members in this team. Add members first.</small>
                    ) : (
                      <div className="flex flex-col gap-1 max-h-40 overflow-y-auto p-2 rounded-xl"
                        style={{ border: "1.5px solid var(--border)", background: "var(--surface-2)" }}>
                        {teamMembers.map((m) => (
                          <label key={m.id} className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded-lg hover:bg-surface transition">
                            <input type="checkbox" checked={selectedAssignees.includes(m.id)} onChange={() => toggleAssignee(m.id)} />
                            <span className="text-token text-xs font-medium">{m.fullName}</span>
                            <small className="text-muted text-[10px]">{m.email}</small>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold" style={{ color: "var(--text-2)" }}>Priority</label>
                  <select className="field" name="priority" value={form.priority} onChange={handleChange}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                {}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold" style={{ color: "var(--text-2)" }}>Start Date</label>
                  <input className="field" type="date" name="startDate" value={form.startDate} onChange={handleChange} />
                </div>

                {}
                <div className="col-span-2 flex flex-col gap-1.5">
                  <label className="text-xs font-bold" style={{ color: "var(--text-2)" }}>Due Date</label>
                  <input className="field" type="date" name="dueDate" value={form.dueDate} onChange={handleChange} />
                </div>
              </div>

              {error && <p className="text-xs px-3 py-2 rounded-lg mt-4" style={{ color: "var(--danger)", background: "var(--danger-bg)" }}>{error}</p>}

              <div className="flex justify-end gap-2.5 mt-6 pt-5" style={{ borderTop: "1px solid var(--border)" }}>
                <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading || teamsLoading || teams.length === 0}>
                  {loading ? "Saving…" : task ? "Save Changes" : "Create Task"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
