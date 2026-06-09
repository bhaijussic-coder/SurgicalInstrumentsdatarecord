import { useEffect, useState } from "react";
import api from "../api/client";

const defaultForm = {
  fullName: "",
  email: "",
  password: "",
  role: "tester",
};

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [backupFile, setBackupFile] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await api.get("/users");
      setUsers(res.data);
    } catch (err) {
      setMessage(err.response?.data?.message || err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const createUser = async (event) => {
    event.preventDefault();
    setMessage("");
    try {
      await api.post("/users", form);
      setForm(defaultForm);
      setMessage("User created successfully");
      loadUsers();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to create user");
    }
  };

  const toggleStatus = async (user) => {
    setMessage("");
    setActionBusy(true);
    try {
      await api.patch(`/users/${user.id}/status`, { isActive: !user.is_active });
      await loadUsers();
    } catch (err) {
      setMessage(err.response?.data?.message || err.message || "Failed to update user status");
    } finally {
      setActionBusy(false);
    }
  };

  const exportBackup = async () => {
    setMessage("");
    setActionBusy(true);
    try {
      const response = await api.get("/users/backup/export");
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `instrument_backup_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
      link.click();
      window.URL.revokeObjectURL(url);
      setMessage("Backup exported successfully.");
    } catch (err) {
      setMessage(err.response?.data?.message || err.message || "Failed to export backup");
    } finally {
      setActionBusy(false);
    }
  };

  const restoreBackup = async () => {
    if (!backupFile) return;
    setMessage("");
    setActionBusy(true);
    try {
      const text = await backupFile.text();
      const payload = JSON.parse(text);
      await api.post("/users/backup/restore", payload);
      setMessage("Backup restored successfully.");
      setBackupFile(null);
      await loadUsers();
    } catch (err) {
      setMessage(err.response?.data?.message || err.message || "Failed to restore backup");
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="panel p-4">
        <h2 className="text-lg font-semibold">User Roles & Permissions</h2>
        <p className="text-sm text-muted">Admin can create users and control Tester/Viewer access.</p>
      </div>

      <form onSubmit={createUser} className="panel grid gap-3 p-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Full Name</label>
          <input
            className="input-base"
            value={form.fullName}
            onChange={(e) => setForm((curr) => ({ ...curr, fullName: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <input
            className="input-base"
            type="email"
            value={form.email}
            onChange={(e) => setForm((curr) => ({ ...curr, email: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Password</label>
          <input
            className="input-base"
            type="password"
            value={form.password}
            onChange={(e) => setForm((curr) => ({ ...curr, password: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Role</label>
          <select
            className="input-base"
            value={form.role}
            onChange={(e) => setForm((curr) => ({ ...curr, role: e.target.value }))}
          >
            <option value="admin">Admin</option>
            <option value="tester">Tester</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>
        <div>
          <button className="btn-primary" type="submit">
            Create User
          </button>
        </div>
        {message && <p className="text-sm text-muted md:col-span-2">{message}</p>}
      </form>

      <div className="panel p-4">
        <h3 className="mb-3 text-sm font-semibold">Users</h3>
        <div className="mb-4 flex flex-wrap items-end gap-2">
          <button className="btn-secondary" type="button" onClick={exportBackup} disabled={actionBusy}>
            {actionBusy ? "Working..." : "Export Backup"}
          </button>
          <input className="input-base max-w-xs" type="file" accept=".json" onChange={(e) => setBackupFile(e.target.files?.[0] || null)} />
          <button className="btn-secondary" type="button" disabled={!backupFile || actionBusy} onClick={restoreBackup}>
            {actionBusy ? "Working..." : "Restore Backup"}
          </button>
        </div>
        <div className="overflow-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="py-2">Name</th>
                <th className="py-2">Email</th>
                <th className="py-2">Role</th>
                <th className="py-2">Status</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-muted">
                    Loading...
                  </td>
                </tr>
              )}
              {!loading &&
                users.map((user) => (
                  <tr key={user.id} className="border-b border-border/60">
                    <td className="py-2">{user.full_name}</td>
                    <td className="py-2">{user.email}</td>
                    <td className="py-2">{user.role}</td>
                    <td className={`py-2 ${user.is_active ? "text-success" : "text-danger"}`}>
                      {user.is_active ? "Active" : "Inactive"}
                    </td>
                    <td className="py-2">
                      <button
                        className="btn-secondary py-1 text-xs"
                        type="button"
                        onClick={() => toggleStatus(user)}
                        disabled={actionBusy}
                      >
                        {user.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default UsersPage;
