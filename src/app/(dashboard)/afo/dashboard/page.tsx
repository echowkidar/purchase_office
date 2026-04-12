"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  CheckCircle,
  TrendingUp,
  Eye,
  Search,
  Filter,
} from "lucide-react";

interface Indent {
  id: string;
  requisitionNo: string;
  status: string;
  urgency: string;
  createdAt: string;
  receiptNo?: string;
  receiptDate?: string;
  department: { name: string; code: string };
  requestedBy: { name: string; designation: string };
  _count: { items: number };
}

export default function AFODashboardPage() {
  const [indents, setIndents] = useState<Indent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [showReceiveDialog, setShowReceiveDialog] = useState<string | null>(null);
  const [receiptNo, setReceiptNo] = useState("");
  const [receiptDate, setReceiptDate] = useState("");

  const fetchIndents = () => {
    setLoading(true);
    fetch("/api/indents")
      .then((res) => res.json())
      .then((data) => {
        setIndents(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchIndents();
  }, []);

  const filtered = indents.filter((i) => {
    if (statusFilter && i.status !== statusFilter) return false;
    if (deptFilter && i.department.code !== deptFilter) return false;
    if (search && !i.requisitionNo.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const stats = {
    total: indents.length,
    submitted: indents.filter((i) => i.status === "SUBMITTED").length,
    received: indents.filter((i) => i.status === "CPO_RECEIVED").length,
    thisMonth: indents.filter((i) => {
      const d = new Date(i.createdAt);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
  };

  const departments = [...new Set(indents.map((i) => i.department.code))].sort();

  const handleReceive = async (indentId: string) => {
    if (!receiptNo || !receiptDate) return;

    const res = await fetch(`/api/indents/${indentId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "CPO_RECEIVED",
        receiptNo,
        receiptDate,
      }),
    });

    if (res.ok) {
      setShowReceiveDialog(null);
      setReceiptNo("");
      setReceiptDate("");
      fetchIndents();
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      SUBMITTED: "badge-submitted",
      CPO_RECEIVED: "badge-received",
      PROCESSING: "badge-pending",
      CLOSED: "badge-closed",
    };
    return map[status] || "bg-gray-100 text-gray-600";
  };

  return (
    <div className="space-y-6 animate-fade-in">
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
              <p className="text-3xl font-bold text-status-pending mt-1">{stats.submitted}</p>
            </div>
            <Clock size={28} className="text-status-pending/20" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Received</p>
              <p className="text-3xl font-bold text-status-received mt-1">{stats.received}</p>
            </div>
            <CheckCircle size={28} className="text-status-received/20" />
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
              placeholder="Search Req. No..."
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
            <option value="CPO_RECEIVED">Received</option>
            <option value="PROCESSING">Processing</option>
            <option value="CLOSED">Closed</option>
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
          <Filter size={16} className="text-gray-400" />
        </div>
      </div>

      {/* Indents Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 text-gray-500 font-medium">Req. No.</th>
                  <th className="text-left p-3 text-gray-500 font-medium">Date</th>
                  <th className="text-left p-3 text-gray-500 font-medium">Department</th>
                  <th className="text-left p-3 text-gray-500 font-medium">Requested By</th>
                  <th className="text-center p-3 text-gray-500 font-medium">Items</th>
                  <th className="text-center p-3 text-gray-500 font-medium">Status</th>
                  <th className="text-left p-3 text-gray-500 font-medium">Receipt</th>
                  <th className="text-center p-3 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((indent) => (
                  <tr key={indent.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3 font-mono text-amu-green font-medium">
                      {indent.requisitionNo}
                    </td>
                    <td className="p-3 text-gray-500">
                      {new Date(indent.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </td>
                    <td className="p-3">{indent.department.name}</td>
                    <td className="p-3 text-gray-500">{indent.requestedBy?.name}</td>
                    <td className="p-3 text-center">{indent._count.items}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge(indent.status)}`}>
                        {indent.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-xs">
                      {indent.receiptNo || "—"}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/indents/${indent.id}`}
                          className="p-1.5 rounded-lg hover:bg-amu-green/10 text-amu-green"
                          title="View"
                        >
                          <Eye size={16} />
                        </Link>
                        {indent.status === "SUBMITTED" && (
                          <button
                            onClick={async () => {
                              setShowReceiveDialog(indent.id);
                              // Auto-fill today's date
                              const today = new Date().toISOString().split("T")[0];
                              setReceiptDate(today);
                              // Fetch next receipt number
                              try {
                                const res = await fetch("/api/indents/next-receipt");
                                const data = await res.json();
                                if (data.receiptNo) {
                                  setReceiptNo(data.receiptNo);
                                }
                              } catch {}
                            }}
                            className="px-3 py-1 rounded-lg bg-status-received text-white text-xs font-medium hover:bg-green-600 transition-all"
                          >
                            Mark Received
                          </button>
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

      {/* Receive Dialog */}
      {showReceiveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-fade-in">
            <h3 className="text-lg font-bold text-amu-green mb-4">
              Mark as Received
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  R.No. (Auto-generated)
                </label>
                <input
                  type="text"
                  value={receiptNo}
                  readOnly
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 font-mono cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">Auto-generated. Cannot be edited.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Receipt Date *
                </label>
                <input
                  type="date"
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amu-green/20"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowReceiveDialog(null);
                    setReceiptNo("");
                    setReceiptDate("");
                  }}
                  className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReceive(showReceiveDialog)}
                  disabled={!receiptNo || !receiptDate}
                  className="flex-1 py-2 rounded-lg bg-status-received text-white font-medium hover:bg-green-600 disabled:opacity-50 transition-all"
                >
                  Confirm Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
