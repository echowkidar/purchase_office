"use client";

import { useEffect, useState } from "react";
import { Users, UserCheck, UserX, Shield, ShieldCheck, Edit2 } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  designation?: string;
  phone?: string;
  createdAt: string;
  department?: { name: string };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    designation: "",
    phone: "",
    password: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchUsers = () => {
    fetch("/api/admin/users")
      .then((res) => res.json())
      .then((data) => {
        setUsers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleActive = async (userId: string, currentState: boolean) => {
    await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !currentState }),
    });
    fetchUsers();
  };

  const changeRole = async (userId: string, role: string) => {
    await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    fetchUsers();
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      designation: user.designation || "",
      phone: user.phone || "",
      password: "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      const payload: Record<string, string> = {
        name: editForm.name,
        email: editForm.email,
        designation: editForm.designation,
        phone: editForm.phone,
      };
      if (editForm.password) {
        payload.password = editForm.password;
      }
      
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setEditingUser(null);
        fetchUsers();
      } else {
        alert("Failed to update user");
      }
    } catch (e) {
      alert("Error updating user");
    } finally {
      setSaving(false);
    }
  };

  const roleBadge = (role: string) => {
    const map: Record<string, string> = {
      SUPER_ADMIN: "bg-purple-50 text-purple-600 border-purple-200",
      AFO_STAFF: "bg-blue-50 text-blue-600 border-blue-200",
      DEPT_USER: "bg-green-50 text-green-600 border-green-200",
    };
    return map[role] || "bg-gray-50 text-gray-600";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-amu-green">Manage Users</h1>
        <p className="text-sm text-gray-400">Activate, deactivate, and assign roles to users</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <Users size={24} className="text-amu-green/30" />
          <div>
            <p className="text-sm text-gray-400">Total Users</p>
            <p className="text-xl font-bold text-amu-green">{users.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <UserCheck size={24} className="text-status-received/30" />
          <div>
            <p className="text-sm text-gray-400">Active</p>
            <p className="text-xl font-bold text-status-received">{users.filter((u) => u.isActive).length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <UserX size={24} className="text-status-pending/30" />
          <div>
            <p className="text-sm text-gray-400">Pending Approval</p>
            <p className="text-xl font-bold text-status-pending">{users.filter((u) => !u.isActive).length}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 text-gray-500 font-medium">Name</th>
                  <th className="text-left p-3 text-gray-500 font-medium">Email</th>
                  <th className="text-left p-3 text-gray-500 font-medium">Department</th>
                  <th className="text-left p-3 text-gray-500 font-medium">Designation</th>
                  <th className="text-center p-3 text-gray-500 font-medium">Role</th>
                  <th className="text-center p-3 text-gray-500 font-medium">Status</th>
                  <th className="text-center p-3 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      !user.isActive ? "bg-yellow-50/50" : ""
                    }`}
                  >
                    <td className="p-3 font-medium">{user.name}</td>
                    <td className="p-3 text-gray-500 font-mono text-xs">{user.email}</td>
                    <td className="p-3">{user.department?.name || "—"}</td>
                    <td className="p-3 text-gray-500">{user.designation || "—"}</td>
                    <td className="p-3 text-center">
                      <select
                        value={user.role}
                        onChange={(e) => changeRole(user.id, e.target.value)}
                        className={`px-2 py-1 rounded-lg border text-xs font-medium ${roleBadge(user.role)}`}
                      >
                        <option value="DEPT_USER">Dept User</option>
                        <option value="AFO_STAFF">AFO Staff</option>
                        <option value="SUPER_ADMIN">Super Admin</option>
                      </select>
                    </td>
                    <td className="p-3 text-center">
                      {user.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-600 text-xs">
                          <ShieldCheck size={12} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-600 text-xs border border-yellow-200">
                          <Shield size={12} /> Pending
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEditClick(user)}
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                        title="Edit User"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => toggleActive(user.id, user.isActive)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                          user.isActive
                            ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                            : "bg-green-50 text-green-600 hover:bg-green-100 border border-green-200"
                        }`}
                      >
                        {user.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-lg p-6">
            <h2 className="text-xl font-bold text-amu-green mb-4">Edit User</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amu-green"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amu-green"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                <input
                  type="text"
                  value={editForm.designation}
                  onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amu-green"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amu-green"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reset Password (Optional)</label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="Leave blank to keep current"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amu-green"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-amu-green hover:bg-amu-green/90 rounded-lg disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
