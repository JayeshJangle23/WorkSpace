
// import React, { useEffect, useState } from "react";
// import { AnimatePresence, motion } from "framer-motion";
// import { X, ClipboardList } from "lucide-react";

// const initialForm = {
//   title: "",
//   description: "",
//   teamId: "",
//   priority: "MEDIUM",
//   startDate: "",
//   dueDate: "",
// };

// export default function TaskModal({
//   open,
//   onClose,
//   onSubmit,
//   task,
//   loading,
// }) {
//   const [form, setForm] = useState(initialForm);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     if (!open) return;

//     setError("");

//     if (task) {
//       setForm({
//         title: task.title || "",
//         description: task.description || "",
//         teamId: task.teamId || "",
//         priority: task.priority || "MEDIUM",
//         startDate: task.startDate
//           ? task.startDate.slice(0, 10)
//           : "",
//         dueDate: task.dueDate
//           ? task.dueDate.slice(0, 10)
//           : "",
//       });
//     } else {
//       setForm(initialForm);
//     }
//   }, [open, task]);

//   const handleChange = (e) => {
//     const { name, value } = e.target;

//     setForm((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");

//     if (!form.title.trim() || !form.teamId.trim()) {
//       setError("Task title and Team ID are required.");
//       return;
//     }

//     if (
//       form.startDate &&
//       form.dueDate &&
//       form.dueDate < form.startDate
//     ) {
//       setError("Due date cannot be before start date.");
//       return;
//     }

//     const payload = {
//       title: form.title.trim(),
//       description: form.description.trim(),
//       teamId: form.teamId.trim(),
//       priority: form.priority,
//       startDate: form.startDate
//         ? new Date(`${form.startDate}T00:00:00`).toISOString()
//         : null,
//       dueDate: form.dueDate
//         ? new Date(`${form.dueDate}T23:59:59`).toISOString()
//         : null,
//     };

//     const success = await onSubmit(payload);

//     if (!success) {
//       setError("Unable to save task. Please check the details.");
//     }
//   };

//   return (
//     <AnimatePresence>
//       {open && (
//         <motion.div
//           className="task-modal-backdrop"
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           exit={{ opacity: 0 }}
//           onMouseDown={(e) => {
//             if (e.target === e.currentTarget) onClose();
//           }}
//         >
//           <motion.div
//             className="task-modal"
//             initial={{ opacity: 0, scale: 0.95, y: 15 }}
//             animate={{ opacity: 1, scale: 1, y: 0 }}
//             exit={{ opacity: 0, scale: 0.95 }}
//             transition={{ duration: 0.22 }}
//           >
//             <div className="task-modal-header">
//               <div className="task-modal-title">
//                 <div className="task-modal-icon">
//                   <ClipboardList size={21} />
//                 </div>

//                 <div>
//                   <h2>{task ? "Edit Task" : "Create New Task"}</h2>
//                   <p>
//                     {task
//                       ? "Update your task details"
//                       : "Add a new task to your workspace"}
//                   </p>
//                 </div>
//               </div>

//               <button
//                 type="button"
//                 className="task-icon-button"
//                 onClick={onClose}
//                 disabled={loading}
//               >
//                 <X size={19} />
//               </button>
//             </div>

//             <form onSubmit={handleSubmit}>
//               <div className="task-form-grid">
//                 <div className="task-form-field full">
//                   <label>Task Title *</label>
//                   <input
//                     name="title"
//                     value={form.title}
//                     onChange={handleChange}
//                     placeholder="Enter task title"
//                     required
//                     maxLength={150}
//                   />
//                 </div>

//                 <div className="task-form-field full">
//                   <label>Description</label>
//                   <textarea
//                     name="description"
//                     value={form.description}
//                     onChange={handleChange}
//                     placeholder="Describe your task..."
//                     rows={4}
//                   />
//                 </div>

//                 <div className="task-form-field full">
//                   <label>Team ID *</label>
//                   <input
//                     name="teamId"
//                     value={form.teamId}
//                     onChange={handleChange}
//                     placeholder="Paste existing team ID"
//                     required
//                   />
//                   <small>
//                     Enter the ID of an existing team.
//                   </small>
//                 </div>

//                 <div className="task-form-field">
//                   <label>Priority</label>
//                   <select
//                     name="priority"
//                     value={form.priority}
//                     onChange={handleChange}
//                   >
//                     <option value="LOW">Low</option>
//                     <option value="MEDIUM">Medium</option>
//                     <option value="HIGH">High</option>
//                     <option value="URGENT">Urgent</option>
//                   </select>
//                 </div>

//                 <div className="task-form-field">
//                   <label>Start Date</label>
//                   <input
//                     type="date"
//                     name="startDate"
//                     value={form.startDate}
//                     onChange={handleChange}
//                   />
//                 </div>

//                 <div className="task-form-field full">
//                   <label>Due Date</label>
//                   <input
//                     type="date"
//                     name="dueDate"
//                     value={form.dueDate}
//                     onChange={handleChange}
//                   />
//                 </div>
//               </div>

//               {error && (
//                 <div className="task-form-error">{error}</div>
//               )}

//               <div className="task-modal-actions">
//                 <button
//                   type="button"
//                   className="task-secondary-button"
//                   onClick={onClose}
//                   disabled={loading}
//                 >
//                   Cancel
//                 </button>

//                 <button
//                   type="submit"
//                   className="task-primary-button"
//                   disabled={loading}
//                 >
//                   {loading
//                     ? "Saving..."
//                     : task
//                       ? "Save Changes"
//                       : "Create Task"}
//                 </button>
//               </div>
//             </form>
//           </motion.div>
//         </motion.div>
//       )}
//     </AnimatePresence>
//   );
// }



import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ClipboardList } from "lucide-react";
import axios from "axios";

const API_URL = "http://localhost:3000/api";

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
  submitting=false,
}) {
  const [form, setForm] = useState(initialForm);
  const [teams, setTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch all teams
  useEffect(() => {
    if (!open) return;

    const fetchTeams = async () => {
      try {
        setTeamsLoading(true);

        const token = localStorage.getItem("token");

        const response = await axios.get(`${API_URL}/teams`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

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

  // Initialize form
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
    } else {
      setForm(initialForm);
    }
  }, [open, task]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.title.trim() || !form.teamId) {
      setError("Task title and team are required.");
      return;
    }

    if (
      form.startDate &&
      form.dueDate &&
      form.dueDate < form.startDate
    ) {
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
                disabled={submitting}
                aria-label="Close modal"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="task-form-grid">
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

                  <small>
                    Select the team for which this task is created.
                  </small>
                </div>

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

                <div className="task-form-field">
                  <label>Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={form.startDate}
                    onChange={handleChange}
                  />
                </div>

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
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="task-primary-button"
                  disabled={submitting || teamsLoading || teams.length === 0}
                >
                  {submitting
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
