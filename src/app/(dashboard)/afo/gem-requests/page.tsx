"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  IdCard,
  Search,
  Eye,
  TrendingUp,
  Clock,
  CheckCircle2,
  Loader2,
  XCircle,
  FileText,
} from "lucide-react";

interface GemRequest {
  id: string;
  requisitionNo: string;
  requestType: "CREATE" | "REPLACE";
  status: "DRAFT" | "SUBMITTED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED";
  userName: string;
  roleToAssign: string;
  createdAt: string;
  department: { name: string; code: string };
  requestedBy: { name: string };
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  SUBMITTED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  DRAFT: <FileText size={12} />,
  SUBMITTED: <Clock size={12} />,
  IN_PROGRESS: <Loader2 size={12} className="animate-spin" />,
  COMPLETED: <CheckCircle2 size={12} />,
  REJECTED: <XCircle size={12} />,
};

export default function AFOGemRequestsPage() {
  const [requests, setRequests] = useState<GemRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");

  const fetchRequests = () => {
    setLoading(true);
    fetch("/api/gem-requests")
      .then((r) => r.json())
      .then((data) => {
        setRequests(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const filtered = requests.filter((r) => {
    if (statusFilter && r.status !== statusFilter) return false;
    if (deptFilter && r.department.code !== deptFilter) return false;
    if (
      search &&
      !r.requisitionNo.toLowerCase().includes(search.toLowerCase()) &&
      !r.userName.toLowerCase().includes(search.toLowerCase()) &&
      !r.department.name.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  const now = new Date();
  const stats = {
    total: requests.length,
    pending: requests.filter((r) => ["SUBMITTED", "IN_PROGRESS"].includes(r.status)).length,
    completed: requests.filter((r) => r.status === "COMPLETED").length,
    thisMonth: requests.filter((r) => {
      const d = new Date(r.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
  };

  const departments = [...new Set(requests.map((r) => r.department.code))].sort();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-amu-green to-amu-green-mid rounded-2xl p-6 text-white shadow-lg flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
          <IdCard size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">GeM ID Requests</h1>
          <p className="text-white/70 text-sm">
            Review and process all GeM Portal User ID requests
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">This Month</p>
              <p className="text-3xl font-bold text-amu-green mt-1">{stats.thisMonth}</p>
            </div>
            <TrendingUp size={28} className="text-amu-green/20" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Pending</p>
              <p className="text-3xl font-bold text-amber-500 mt-1">{stats.pending}</p>
            </div>
            <Clock size={28} className="text-amber-500/20" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Completed</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.completed}</p>
            </div>
            <CheckCircle2 size={28} className="text-green-600/20" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total</p>
              <p className="text-3xl font-bold text-gray-600 mt-1">{stats.total}</p>
            </div>
            <FileText size={28} className="text-gray-300" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Req. No., user, or department..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-amu-green/30"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-amu-green/30"
          >
            <option value="">All Status</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-amu-green/30"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <Loader2 size={32} className="animate-spin mx-auto mb-2" />
            <p>Loading...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <IdCard size={40} className="mx-auto mb-2 opacity-30" />
            <p>No GeM requests found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left p-3 text-gray-500 font-medium">Req. No.</th>
                  <th className="text-left p-3 text-gray-500 font-medium">Date</th>
                  <th className="text-left p-3 text-gray-500 font-medium">Department</th>
                  <th className="text-left p-3 text-gray-500 font-medium">User Name</th>
                  <th className="text-left p-3 text-gray-500 font-medium">Type</th>
                  <th className="text-center p-3 text-gray-500 font-medium">Status</th>
                  <th className="text-center p-3 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3 font-mono text-amu-green font-medium">
                      {req.requisitionNo}
                    </td>
                    <td className="p-3 text-gray-500 text-xs">
                      {new Date(req.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="p-3 text-sm">{req.department.name}</td>
                    <td className="p-3 font-medium">{req.userName}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          req.requestType === "CREATE"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {req.requestType === "CREATE" ? "New" : "Replace"}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[req.status]}`}
                      >
                        {STATUS_ICONS[req.status]}
                        {req.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <Link
                        href={`/afo/gem-requests/${req.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amu-green/10 text-amu-green hover:bg-amu-green hover:text-white text-xs font-medium transition-all"
                      >
                        <Eye size={13} />
                        Process
                      </Link>
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
