import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Users, Pencil, Trash2, UserPlus, UserMinus } from "lucide-react";
import api from "../api/axios";
import Modal from "../components/Modal";

const initialForm = {
  name: "",
  description: "",
  managerId: "",
};
import { useAuth } from "../context/AuthContext";

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState("");
  const [memberId, setMemberId] = useState("");
  const [error, setError] = useState("");

  const { user } = useAuth();

  const isAdmin = user?.role === "ADMIN";
  const isManager = user?.role === "MANAGER";

  const canCreateTeam = isAdmin;
  const canEditTeam = isAdmin || isManager;
  const canDeleteTeam = isAdmin;
  const canManageMembers = isAdmin || isManager;

  const loadData = async () => {
    try {
      const [teamRes, userRes] = await Promise.all([
        api.get("/teams"),
        api.get("/users"),
      ]);

      setTeams(teamRes.data.teams || []);
      setUsers(userRes.data.users || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load data");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setModal("team");
  };

  const openEdit = async (id) => {
    try {
      const res = await api.get(`/teams/${id}`);
      // const team = res.data.teams || res.data.teams?.[0];
      const team = Array.isArray(res.data.teams)
        ? res.data.teams[0]
        : res.data.team;

      if (!team) throw new Error("Team not found");

      setEditing(id);
      setForm({
        name: team.name || "",
        description: team.description || "",
        managerId: team.managerId || "",
      });
      setModal("team");
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const saveTeam = async (e) => {
    e.preventDefault();

    try {
      if (editing) {
        await api.patch(`/teams/${editing}`, form);
      } else {
        await api.post("/teams", form);
      }

      setModal("");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save team");
    }
  };

  const viewTeam = async (id) => {
    try {
      const res = await api.get(`/teams/${id}`);
      setSelected(res.data.teams || res.data.teams?.[0]);
      setModal("details");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load team");
    }
  };

  const addMember = async (e) => {
    e.preventDefault();

    try {
      await api.post(`/teams/${selected.id}/members`, {
        userId: memberId,
      });

      await viewTeam(selected.id);
      await loadData();
      setMemberId("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to add member");
    }
  };

  const removeMember = async (userId) => {
    if (!window.confirm("Remove this team member?")) return;

    try {
      await api.delete(`/teams/${selected.id}/members/${userId}`);

      await viewTeam(selected.id);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to remove member");
    }
  };

  // const deleteTeam = async (id) => {
  //   if (!window.confirm("Delete this team?")) return;

  //   try {
  //     await api.delete(`/teams/${id}`);
  //     await loadData();
  //   } catch (err) {
  //     setError(err.response?.data?.message || "Unable to delete team");
  //   }
  // };

  const deleteTeam = async (id) => {
    if (!window.confirm("Are you sure you want to delete this team?")) {
      return;
    }

    try {
      await api.delete(`/teams/${id}`);

      setError("");
      await loadData();

      alert("Team deleted successfully!");
    } catch (err) {
      console.error("Delete Team Error:", err.response?.data || err);

      setError(err.response?.data?.message || "Unable to delete team");
    }
  };
  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <h1>Teams</h1>
          <p>Create teams and manage their members.</p>
        </div>

        {canCreateTeam && (
          <button className="primary-button" onClick={openCreate}>
            <Plus size={18} />
            Create Team
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="team-grid">
        <AnimatePresence>
          {teams.map((team, i) => (
            <motion.div
              className="panel team-card"
              key={team.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="team-card-top">
                <div className="team-icon">
                  <Users size={23} />
                </div>

                <div className="action-buttons">
                  {canEditTeam && (
                    <button
                      className="icon-button"
                      onClick={() => openEdit(team.id)}
                    >
                      <Pencil size={17} />
                    </button>
                  )}

                  {/* <button
                    className="icon-button danger"
                    onClick={() => deleteTeam(team.id)}
                  >
                    <Trash2 size={17} />
                  </button> */}
                  {canDeleteTeam && (
                    <button
                      className="icon-button danger"
                      onClick={() => deleteTeam(team.id)}
                    >
                      <Trash2 size={17} />
                    </button>
                  )}
                </div>
              </div>

              <h3>{team.name}</h3>
              <p>{team.description || "No description available"}</p>

              <div className="team-meta">
                <span>{team.manager?.fullName || "Manager"}</span>
                <span>{team._count?.members ?? 0} members</span>
              </div>

              {canManageMembers && (
                <button
                  className="secondary-button"
                  onClick={() => viewTeam(team.id)}
                >
                  Manage Members
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Modal
        open={modal === "team"}
        onClose={() => setModal("")}
        title={editing ? "Edit Team" : "Create Team"}
      >
        <form className="form-stack" onSubmit={saveTeam}>
          <label>Team name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

          <label>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <label>Manager</label>
          <select
            value={form.managerId}
            onChange={(e) => setForm({ ...form, managerId: e.target.value })}
            required
          >
            <option value="">Select manager</option>
            {users
              .filter((u) => u.role === "MANAGER" && u.isActive)
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName}
                </option>
              ))}
          </select>

          <button className="primary-button">
            {editing ? "Update Team" : "Create Team"}
          </button>
        </form>
      </Modal>

      <Modal
        open={modal === "details"}
        onClose={() => setModal("")}
        title={selected?.name || "Team Members"}
      >
        {selected && (
          <div className="form-stack">
            <p>{selected.description}</p>

            <form onSubmit={addMember}>
              <label>Add employee</label>
              <select
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                required
              >
                <option value="">Select employee</option>
                {users
                  .filter(
                    (u) =>
                      u.role === "EMPLOYEE" &&
                      u.isActive &&
                      !selected.members?.some((m) => m.userId === u.id),
                  )
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName}
                    </option>
                  ))}
              </select>

              <button className="primary-button">
                <UserPlus size={17} /> Add Member
              </button>
            </form>

            <h4>Current Members</h4>

            {selected.members?.map((member) => (
              <div className="member-row" key={member.id}>
                <div>
                  <strong>{member.user?.fullName}</strong>
                  <small>{member.user?.email}</small>
                </div>

                <button
                  className="icon-button danger"
                  onClick={() => removeMember(member.userId)}
                  title="Remove member"
                >
                  <UserMinus size={18} />
                </button>
              </div>
            ))}

            {selected.members?.length === 0 && (
              <p>No members in this team yet.</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
