import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ShieldCheck,
  KeyRound,
} from "lucide-react";
import api from "../api/axios";
import Modal from "../components/Modal";

const emptyForm = {
  fullName: "",
  email: "",
  password: "",
  role: "EMPLOYEE",
};

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

  const loadUsers = async () => {
    try {
      const res = await api.get("/users");
      setUsers(res.data.users || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load users");
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openPasswordModal = (user) => {
    setSelectedUser(user);
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
    setPasswordModal(true);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    try {
      setPasswordLoading(true);

      const res = await api.patch(`/users/${selectedUser.id}/password`, {
        newPassword,
      });

      setPasswordModal(false);
      setSelectedUser(null);
      setNewPassword("");
      setConfirmPassword("");

      alert(res.data.message || "Password changed successfully");
    } catch (err) {
      setPasswordError(
        err.response?.data?.message || "Unable to change password",
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const openEdit = async (id) => {
    try {
      const res = await api.get(`/users/${id}`);
      const user = res.data.user || res.data.users?.[0];

      if (!user) throw new Error("User not found");

      setEditing(id);
      setForm({
        fullName: user.fullName,
        email: user.email,
        password: "",
        role: user.role,
        avatarUrl: user.avatarUrl || "",
      });

      setShowModal(true);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const saveUser = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (editing) {
        const { fullName, email, avatarUrl } = form;

        await api.patch(`/users/${editing}`, {
          fullName,
          email,
          avatarUrl,
        });

        if (form.role) {
          await api.patch(`/users/${editing}/role`, {
            role: form.role,
          });
        }
      } else {
        await api.post("/users", form);
      }

      setShowModal(false);
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save user");
    }
  };

  const changeRole = async (id, role) => {
    try {
      await api.patch(`/users/${id}/role`, { role });
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to change role");
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await api.delete(`/users/${id}`);
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete user");
    }
  };

  const filtered = users.filter((u) => {
    const matchesSearch = `${u.fullName} ${u.email}`
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <h1>User Management</h1>
          <p>Manage employees, administrators and managers.</p>
        </div>

        <button className="primary-button" onClick={openCreate}>
          <Plus size={18} /> Add User
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="toolbar panel">
        <div className="search-box">
          <Search size={18} />
          <input
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="ALL">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="MANAGER">Manager</option>
          <option value="EMPLOYEE">Employee</option>
        </select>
      </div>

      <div className="panel table-panel">
        <div className="table-heading">
          <div>
            <h3>All Users</h3>
            <p>{filtered.length} members found</p>
          </div>
          <ShieldCheck size={23} />
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>USER</th>
                <th>EMAIL</th>
                <th>ROLE</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              <AnimatePresence>
                {filtered.map((user) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, x: -15 }}
                  >
                    <td>
                      <div className="table-user">
                        <div className="avatar">{user.fullName?.charAt(0)}</div>
                        <strong>{user.fullName}</strong>
                      </div>
                    </td>

                    <td>{user.email}</td>

                    <td>
                      <select
                        className="role-select"
                        value={user.role}
                        onChange={(e) => changeRole(user.id, e.target.value)}
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="MANAGER">MANAGER</option>
                        <option value="EMPLOYEE">EMPLOYEE</option>
                      </select>
                    </td>

                    <td>
                      <span
                        className={`status ${user.isActive ? "active-status" : "inactive-status"}`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <div className="action-buttons">
                        {/* Edit User */}
                        <button
                          className="icon-button"
                          title="Edit user"
                          onClick={() => openEdit(user.id)}
                        >
                          <Pencil size={17} />
                        </button>

                        {/* Change Password */}
                        <button
                          className="icon-button"
                          title="Change password"
                          onClick={() => openPasswordModal(user)}
                        >
                          <KeyRound size={17} />
                        </button>

                        {/* Delete User */}
                        <button
                          className="icon-button danger"
                          title="Delete user"
                          onClick={() => deleteUser(user.id)}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <p className="empty-state">No users found.</p>
        )}
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Edit User" : "Create User"}
      >
        <form className="form-stack" onSubmit={saveUser}>
          <label>Full name</label>
          <input
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            required
          />

          <label>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />

          {!editing && (
            <>
              <label>Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={8}
              />
            </>
          )}

          <label>Role</label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="EMPLOYEE">Employee</option>
            <option value="MANAGER">Manager</option>
            <option value="ADMIN">Admin</option>
          </select>

          <label>Avatar URL</label>
          <input
            value={form.avatarUrl || ""}
            onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
          />

          <button className="primary-button" type="submit">
            {editing ? "Save Changes" : "Create User"}
          </button>
        </form>
      </Modal>
      <Modal
        open={passwordModal}
        onClose={() => {
          setPasswordModal(false);
          setPasswordError("");
        }}
        title="Change User Password"
      >
        <form className="form-stack" onSubmit={handleChangePassword}>
          <p>
            Change password for:
            <strong> {selectedUser?.fullName}</strong>
          </p>

          <label>New Password</label>

          <input
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            required
          />

          <label>Confirm New Password</label>

          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={8}
            required
          />

          {passwordError && (
            <div className="error-message">{passwordError}</div>
          )}

          <button
            className="primary-button"
            type="submit"
            disabled={passwordLoading}
          >
            {passwordLoading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
