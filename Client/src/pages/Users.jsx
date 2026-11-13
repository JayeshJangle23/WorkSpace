import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Pencil, Trash2, ShieldCheck, KeyRound, ToggleLeft, ToggleRight } from "lucide-react";
import api from "../api/axios";
import Modal from "../components/Modal";

const emptyForm = { fullName: "", email: "", password: "", role: "EMPLOYEE" };

export default function Users() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [error, setError] = useState("");
  const [passwordModal, setPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const loadUsers = async () => {
    try {
      const res = await api.get("/users", { params: { role: roleFilter } });
      setUsers(res.data.users || []);
    } catch (err) { setError(err.response?.data?.message || "Failed to load users"); }
  };

  useEffect(() => { loadUsers(); }, [roleFilter]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };

  const openEdit = async (id) => {
    try {
      const res = await api.get(`/users/${id}`);
      const u = res.data.user;
      if (!u) throw new Error("Not found");
      setEditing(id);
      setForm({ fullName: u.fullName, email: u.email, password: "", role: u.role, avatarUrl: u.avatarUrl || "" });
      setShowModal(true);
    } catch (err) { setError(err.response?.data?.message || err.message); }
  };

  const saveUser = async (e) => {
    e.preventDefault(); setError("");
    try {
      if (editing) {
        await api.patch(`/users/${editing}`, { fullName: form.fullName, email: form.email, avatarUrl: form.avatarUrl });
        if (form.role) await api.patch(`/users/${editing}/role`, { role: form.role });
      } else { await api.post("/users", form); }
      setShowModal(false); await loadUsers();
    } catch (err) { setError(err.response?.data?.message || "Unable to save"); }
  };

  const changeRole = async (id, role) => {
    try { await api.patch(`/users/${id}/role`, { role }); await loadUsers(); }
    catch (err) { setError(err.response?.data?.message || "Unable to change role"); }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try { await api.delete(`/users/${id}`); await loadUsers(); }
    catch (err) { setError(err.response?.data?.message || "Unable to delete"); }
  };

  const handleToggleStatus = async (user) => {
    try {
      setTogglingId(user.id);
      const res = await api.patch(`/users/${user.id}/status`);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u))
      );
    } catch (err) {
      setError(err.response?.data?.message || "Unable to toggle status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault(); setPasswordError("");
    if (newPassword.length < 8) return setPasswordError("Must be 8+ characters");
    if (newPassword !== confirmPassword) return setPasswordError("Passwords don't match");
    try {
      setPasswordLoading(true);
      const res = await api.patch(`/users/${selectedUser.id}/password`, { newPassword });
      setPasswordModal(false); setNewPassword(""); setConfirmPassword("");
      alert(res.data.message || "Password updated");
    } catch (err) { setPasswordError(err.response?.data?.message || "Failed"); }
    finally { setPasswordLoading(false); }
  };

  const filtered = users.filter((u) =>
    `${u.fullName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-pad flex flex-col gap-6">
      {}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-token text-2xl font-extrabold tracking-tight m-0 mb-1">User Management</h1>
          <p className="font-body text-muted text-sm m-0">Manage employees, administrators and managers.</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <Plus size={17} /> Add User
        </button>
      </div>

      {error && <p className="text-sm px-4 py-3 rounded-lg" style={{ color: "var(--danger)", background: "var(--danger-bg)" }}>{error}</p>}

      {}
      {

}
      {}
      <div className="card !flex !flex-col sm:!flex-row sm:items-center gap-3 p-3">
        <div
          className="flex items-center gap-2 w-full sm:flex-1 min-w-0 px-3 py-2 rounded-xl bg-surface-2 border-token"
          style={{ border: "1px solid var(--border)" }}
        >
          <Search size={16} className="text-muted flex-shrink-0" />
          <input
            className="flex-1 min-w-0 bg-transparent outline-none text-sm text-token"
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="field !w-full sm:!w-auto"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="ALL">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="MANAGER">Manager</option>
          <option value="EMPLOYEE">Employee</option>
        </select>
      </div>

      {}
      <div className="card">
        <div className="flex items-center justify-between gap-3 p-5 pb-4">
          <div>
            <h3 className="text-token text-base font-bold m-0">All Users</h3>
            <p className="text-muted text-xs mt-1">{filtered.length} members found</p>
          </div>
          <ShieldCheck size={22} className="text-muted" />
        </div>

        <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr>
                {["USER", "EMAIL", "ROLE", "STATUS", "ACTIONS"].map((h) => (
                  <th key={h} className="text-muted text-[10px] font-bold tracking-widest uppercase px-4 py-3 bg-surface-2">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((u) => (
                  <motion.tr key={u.id} className="hover:bg-surface-2 transition-colors"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -12 }}>
                    <td className="px-4 py-3 text-sm" style={{ borderBottom: "1px solid var(--border)" }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl grid place-items-center font-bold text-xs flex-shrink-0"
                          style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                          {u.fullName?.charAt(0)}
                        </div>
                        <strong className="text-token text-xs">{u.fullName}</strong>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted" style={{ borderBottom: "1px solid var(--border)" }}>{u.email}</td>
                    <td className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                      <select className="field py-1.5 text-xs w-auto"
                        value={u.role} onChange={(e) => changeRole(u.id, e.target.value)}>
                        <option value="ADMIN">ADMIN</option>
                        <option value="MANAGER">MANAGER</option>
                        <option value="EMPLOYEE">EMPLOYEE</option>
                      </select>
                    </td>
                    <td className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                      <button
                        className="flex items-center gap-1.5 text-xs font-semibold transition-opacity"
                        style={{ opacity: togglingId === u.id ? 0.5 : 1 }}
                        disabled={togglingId === u.id}
                        title={u.isActive ? "Deactivate user" : "Activate user"}
                        onClick={() => handleToggleStatus(u)}
                      >
                        {u.isActive ? (
                          <ToggleRight size={22} style={{ color: "var(--success, #10B981)" }} />
                        ) : (
                          <ToggleLeft size={22} className="text-muted" />
                        )}
                        <span className={u.isActive ? "text-token" : "text-muted"}>
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                      <div className="flex items-center gap-1.5">
                        <button className="btn-icon" title="Edit" onClick={() => openEdit(u.id)}><Pencil size={15} /></button>
                        <button className="btn-icon" title="Change password"
                          onClick={() => { setSelectedUser(u); setNewPassword(""); setConfirmPassword(""); setPasswordError(""); setPasswordModal(true); }}>
                          <KeyRound size={15} />
                        </button>
                        <button className="btn-icon danger" title="Delete" onClick={() => deleteUser(u.id)}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-muted">
            <p className="text-sm">No users found.</p>
          </div>
        )}
      </div>

      {}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? "Edit User" : "Create User"}>
        <form className="flex flex-col gap-3 pt-3" onSubmit={saveUser}>
          {[
            { label: "Full name", key: "fullName", type: "text" },
            { label: "Email", key: "email", type: "email" },
          ].map(({ label, key, type }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className="text-xs font-bold" style={{ color: "var(--text-2)" }}>{label}</label>
              <input className="field" type={type} value={form[key] || ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} required />
            </div>
          ))}
          {!editing && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold" style={{ color: "var(--text-2)" }}>Password</label>
              <input className="field" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold" style={{ color: "var(--text-2)" }}>Role</label>
            <select className="field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="EMPLOYEE">Employee</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold" style={{ color: "var(--text-2)" }}>Avatar URL</label>
            <input className="field" type="text" value={form.avatarUrl || ""} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} />
          </div>
          <button className="btn-primary mt-1" type="submit">{editing ? "Save Changes" : "Create User"}</button>
        </form>
      </Modal>

      {}
      <Modal open={passwordModal} onClose={() => setPasswordModal(false)} title="Change Password">
        <form className="flex flex-col gap-3 pt-3" onSubmit={handleChangePassword}>
          <p className="text-sm text-muted m-0">Change password for <strong className="text-token">{selectedUser?.fullName}</strong></p>
          {[{ label: "New Password", val: newPassword, set: setNewPassword }, { label: "Confirm Password", val: confirmPassword, set: setConfirmPassword }]
            .map(({ label, val, set }) => (
              <div key={label} className="flex flex-col gap-1.5">
                <label className="text-xs font-bold" style={{ color: "var(--text-2)" }}>{label}</label>
                <input className="field" type="password" value={val} onChange={(e) => set(e.target.value)} required minLength={8} />
              </div>
            ))}
          {passwordError && <p className="text-xs px-3 py-2 rounded-lg" style={{ color: "var(--danger)", background: "var(--danger-bg)" }}>{passwordError}</p>}
          <button className="btn-primary mt-1" type="submit" disabled={passwordLoading}>{passwordLoading ? "Updating…" : "Update Password"}</button>
        </form>
      </Modal>
    </div>
  );
}
