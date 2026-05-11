"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  IdCard,
  Search,
  Plus,
  Eye,
  Printer,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
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

export default function GemRequestsListPage() {
  const [requests, setRequests] = useState<GemRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetch("/api/gem-requests")
      .then((r) => r.json())
      .then((data) => {
        setRequests(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = requests.filter((r) => {
    if (statusFilter && r.status !== statusFilter) return false;
    if (
      search &&
      !r.requisitionNo.toLowerCase().includes(search.toLowerCase()) &&
      !r.userName.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-amu-green to-amu-green-mid rounded-2xl p-6 text-white shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
            <IdCard size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">GeM ID Requests</h1>
            <p className="text-white/70 text-sm">Manage GeM Portal User ID requests</p>
          </div>
        </div>
        <Link
          href="/gem-requests/new"
          className="flex items-center gap-2 bg-amu-gold text-white px-4 py-2 rounded-xl font-medium hover:bg-amu-gold-light transition-all shadow-md"
        >
          <Plus size={18} />
          New Request
        </Link>
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
              placeholder="Search by Req. No. or user name..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-amu-green/30"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-amu-green/30"
          >
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <Loader2 size={32} className="animate-spin mx-auto mb-2" />
            <p>Loading requests...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <IdCard size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No GeM requests found</p>
            <Link href="/gem-requests/new" className="text-amu-gold text-sm mt-2 inline-block">
              Create your first request →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left p-3 text-gray-500 font-medium">Req. No.</th>
                  <th className="text-left p-3 text-gray-500 font-medium">Date</th>
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
                    <td className="p-3 text-gray-500">
                      {new Date(req.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="p-3 font-medium">{req.userName}</td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          req.requestType === "CREATE"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {req.requestType === "CREATE" ? "New ID" : "Replace"}
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
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/gem-requests/${req.id}`}
                          className="p-1.5 rounded-lg hover:bg-amu-green/10 text-amu-green"
                          title="View"
                        >
                          <Eye size={16} />
                        </Link>
                        {(req.status === "SUBMITTED" || req.status === "COMPLETED") && (
                          <Link
                            href={`/gem-requests/${req.id}/print`}
                            target="_blank"
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                            title="Print"
                          >
                            <Printer size={16} />
                          </Link>
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
