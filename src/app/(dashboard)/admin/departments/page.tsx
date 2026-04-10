"use client";

import { useEffect, useState } from "react";
import { Building2, Plus, Edit2, Check, X } from "lucide-react";

interface Department {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  _count?: { users: number; indents: number };
}

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");

  const fetchDepts = () => {
    fetch("/api/admin/departments")
      .then((res) => res.json())
      .then((data) => {
        setDepartments(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchDepts();
  }, []);

  const handleAdd = async () => {
    if (!newName || !newCode) return;
    const res = await fetch("/api/admin/departments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, code: newCode.toUpperCase() }),
    });
    if (res.ok) {
      setShowAdd(false);
      setNewName("");
      setNewCode("");
      fetchDepts();
    }
  };

  const handleEdit = async (id: string) => {
    if (!editName || !editCode) return;
    await fetch("/api/admin/departments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name: editName, code: editCode.toUpperCase() }),
    });
    setEditId(null);
    fetchDepts();
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await fetch("/api/admin/departments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: !isActive }),
    });
    fetchDepts();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-amu-green">Departments</h1>
          <p className="text-sm text-gray-400">Manage AMU departments</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amu-gold text-amu-green font-semibold hover:bg-amu-gold-light transition-all shadow-sm"
        >
          <Plus size={16} /> Add Department
        </button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="bg-white rounded-xl shadow-sm border border-amu-gold/20 p-4 animate-fade-in">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Department of..."
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-amu-green/30"
              />
            </div>
            <div className="w-28">
              <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
              <input
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="CS"
                maxLength={10}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono uppercase focus:outline-none focus:ring-1 focus:ring-amu-green/30"
              />
            </div>
            <button
              onClick={handleAdd}
              className="px-4 py-2 rounded-lg bg-amu-green text-white text-sm font-medium hover:bg-amu-green-mid"
            >
              Add
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-500 text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 text-gray-500 font-medium">Department</th>
                  <th className="text-left p-3 text-gray-500 font-medium">Code</th>
                  <th className="text-center p-3 text-gray-500 font-medium">Status</th>
                  <th className="text-center p-3 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {departments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-gray-50">
                    <td className="p-3">
                      {editId === dept.id ? (
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="px-2 py-1 border border-gray-200 rounded text-sm w-full"
                        />
                      ) : (
                        <span className="flex items-center gap-2">
                          <Building2 size={14} className="text-amu-green" />
                          <span className="font-medium">{dept.name}</span>
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-xs">
                      {editId === dept.id ? (
                        <input
                          value={editCode}
                          onChange={(e) => setEditCode(e.target.value)}
                          className="px-2 py-1 border border-gray-200 rounded text-sm font-mono uppercase w-20"
                        />
                      ) : (
                        dept.code
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          dept.isActive
                            ? "bg-green-50 text-green-600"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {dept.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-2">
                        {editId === dept.id ? (
                          <>
                            <button
                              onClick={() => handleEdit(dept.id)}
                              className="p-1 rounded text-green-600 hover:bg-green-50"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => setEditId(null)}
                              className="p-1 rounded text-red-400 hover:bg-red-50"
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditId(dept.id);
                                setEditName(dept.name);
                                setEditCode(dept.code);
                              }}
                              className="p-1.5 rounded-lg hover:bg-amu-green/10 text-amu-green"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => toggleActive(dept.id, dept.isActive)}
                              className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                dept.isActive
                                  ? "text-red-500 hover:bg-red-50"
                                  : "text-green-500 hover:bg-green-50"
                              }`}
                            >
                              {dept.isActive ? "Disable" : "Enable"}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
