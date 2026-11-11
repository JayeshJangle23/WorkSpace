import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Users, Pencil, Trash2, UserPlus, UserMinus } from "lucide-react";
import api from "../api/axios";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";

const initForm = { name: "", description: "", managerId: "" };

export default function Teams() {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(initForm);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState("");
  const [memberId, setMemberId] = useState("");
  const [error, setError] = useState("");

  const isAdmin = user?.role === "ADMIN";
  const isManager = user?.role === "MANAGER";

  const loadData = async () => {
    try {
      const reqs = [api.get("/teams")];
      if (isAdmin || isManager) reqs.push(api.get("/users"));
      const [teamRes, userRes] = await Promise.all(reqs);
      setTeams(teamRes.data.teams || []);
      if (userRes) setUsers(userRes.data.users || []);
    } catch (err) { setError(err.response?.data?.message || "Failed to load"); }
  };

  useEffect(() => { loadData(); }, []);

  const openCreate = () => { setEditing(null); setForm(initForm); setModal("team"); };

  const openEdit = async (id) => {
    try {
      const res = await api.get(`/teams/${id}`);
      const t = res.data.team;
      if (!t) throw new Error("Not found");
      setEditing(id);
      setForm({ name: t.name || "", description: t.description || "", managerId: t.managerId || "" });
      setModal("team");
    } catch (err) { setError(err.response?.data?.message || err.message); }
  };

  const saveTeam = async (e) => {
    e.preventDefault();
    try {
      editing ? await api.patch(`/teams/${editing}`, form) : await api.post("/teams", form);
      setModal(""); await loadData();
    } catch (err) { setError(err.response?.data?.message || "Unable to save"); }
  };

  const viewTeam = async (id) => {
    try { const res = await api.get(`/teams/${id}`); setSelected(res.data.team); setModal("details"); }
    catch (err) { setError(err.response?.data?.message || "Failed to load team"); }
  };

  const addMember = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/teams/${selected.id}/members`, { userId: memberId });
      await viewTeam(selected.id); await loadData(); setMemberId("");
    } catch (err) { setError(err.response?.data?.message || "Unable to add member"); }
  };

  const removeMember = async (uid) => {
    if (!window.confirm("Remove this member?")) return;
    try {
      await api.delete(`/teams/${selected.id}/members/${uid}`);
      await viewTeam(selected.id); await loadData();
    } catch (err) { setError(err.response?.data?.message || "Unable to remove"); }
  };

  const deleteTeam = async (id) => {
    if (!window.confirm("Delete this team?")) return;
    try { await api.delete(`/teams/${id}`); setError(""); await loadData(); }
    catch (err) { setError(err.response?.data?.message || "Unable to delete"); }
  };

  return (
    <div className="page-pad flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-token text-2xl font-extrabold tracking-tight m-0 mb-1">Teams</h1>
          <p className="font-body text-muted text-sm m-0">Create teams and manage their members.</p>
        </div>
        {isAdmin && <button className="btn-primary" onClick={openCreate}><Plus size={17} /> Create Team</button>}
      </div>

      {error && <p className="text-sm px-4 py-3 rounded-lg" style={{ color: "var(--danger)", background: "var(--danger-bg)" }}>{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence>
          {teams.map((team, i) => (
            <motion.div key={team.id} className="card p-5 flex flex-col gap-3 hover:-translate-y-1 transition-transform"
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: i * 0.05 }}>
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl grid place-items-center" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                  <Users size={20} />
                </div>
                <div className="flex items-center gap-1.5">
                  {(isAdmin || isManager) && <button className="btn-icon" onClick={() => openEdit(team.id)}><Pencil size={15} /></button>}
                  {isAdmin && <button className="btn-icon danger" onClick={() => deleteTeam(team.id)}><Trash2 size={15} /></button>}
                </div>
              </div>

              <h3 className="text-token text-[15px] font-bold m-0">{team.name}</h3>
              <p className="text-muted text-xs m-0 leading-relaxed">{team.description || "No description available"}</p>

              <div className="flex items-center justify-between pt-2 mt-auto text-muted text-xs font-medium"
                style={{ borderTop: "1px solid var(--border)" }}>
                <span>{team.manager?.fullName || "No manager"}</span>
                <span>{team._count?.members ?? 0} members</span>
              </div>

              {(isAdmin || isManager) && (
                <button className="btn-secondary text-xs py-2" onClick={() => viewTeam(team.id)}>
                  Manage Members
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Team form modal */}
      <Modal open={modal === "team"} onClose={() => setModal("")} title={editing ? "Edit Team" : "Create Team"}>
        <form className="flex flex-col gap-3 pt-3" onSubmit={saveTeam}>
          {[
            { label: "Team name", key: "name", tag: "input" },
            { label: "Description", key: "description", tag: "textarea" },
          ].map(({ label, key, tag: Tag }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className="text-xs font-bold" style={{ color: "var(--text-2)" }}>{label}</label>
              <Tag className="field" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} required={key === "name"} />
            </div>
          ))}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold" style={{ color: "var(--text-2)" }}>Manager</label>
            <select className="field" value={form.managerId} onChange={(e) => setForm({ ...form, managerId: e.target.value })} required>
              <option value="">Select manager</option>
              {users.filter(u => u.role === "MANAGER" && u.isActive).map(u => (
                <option key={u.id} value={u.id}>{u.fullName}</option>
              ))}
            </select>
          </div>
          <button className="btn-primary mt-1" type="submit">{editing ? "Update Team" : "Create Team"}</button>
        </form>
      </Modal>

      {/* Members modal */}
      <Modal open={modal === "details"} onClose={() => setModal("")} title={selected?.name || "Team Members"}>
        {selected && (
          <div className="flex flex-col gap-4 pt-3">
            {selected.description && <p className="text-muted text-sm m-0">{selected.description}</p>}

            {(isAdmin || isManager) && (
              <form onSubmit={addMember} className="flex flex-col gap-2">
                <label className="text-xs font-bold" style={{ color: "var(--text-2)" }}>Add Employee</label>
                <div className="flex gap-2">
                  <select className="field flex-1" value={memberId} onChange={(e) => setMemberId(e.target.value)} required>
                    <option value="">Select employee</option>
                    {users.filter(u => u.role === "EMPLOYEE" && u.isActive && !selected.members?.some(m => m.userId === u.id))
                      .map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                  </select>
                  <button className="btn-primary" type="submit"><UserPlus size={16} /></button>
                </div>
              </form>
            )}

            <h4 className="text-token text-sm font-bold m-0">Current Members</h4>
            {selected.members?.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 py-2.5"
                style={{ borderBottom: "1px solid var(--border)" }}>
                <div>
                  <strong className="block text-token text-xs">{m.user?.fullName}</strong>
                  <small className="text-muted text-[11px]">{m.user?.email}</small>
                </div>
                {(isAdmin || isManager) && (
                  <button className="btn-icon danger" onClick={() => removeMember(m.userId)} title="Remove">
                    <UserMinus size={15} />
                  </button>
                )}
              </div>
            ))}
            {(!selected.members || selected.members.length === 0) && (
              <p className="text-muted text-sm text-center py-4">No members yet.</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
