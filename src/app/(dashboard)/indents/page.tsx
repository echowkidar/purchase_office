"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { FileText, Eye, Printer, Search, Trash2, Loader2 } from "lucide-react";

interface Indent {
  id: string;
  requisitionNo: string;
  status: string;
  urgency: string;
  createdAt: string;
  receiptNo?: string;
  receiptDate?: string;
  department: { name: string };
  _count: { items: number };
}

export default function IndentsListPage() {
  const [indents, setIndents] = useState<Indent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { data: session } = useSession();
  const role = session?.user?.role;
  const [isIndentEnabled, setIsIndentEnabled] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.ENABLE_INDENT_CREATION) {
          setIsIndentEnabled(data.ENABLE_INDENT_CREATION === "true");
        }
      })
      .catch((err) => console.error(err));

    fetch("/api/indents")
      .then((res) => res.json())
      .then((data) => {
        setIndents(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = indents.filter((i) =>
    i.requisitionNo.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this draft indent?")) return;
    try {
      const res = await fetch(`/api/indents/${id}`, { method: "DELETE" });
      if (res.ok) {
        setIndents((prev) => prev.filter((i) => i.id !== id));
      } else {
        alert("Failed to delete indent");
      }
    } catch {
      alert("Failed to delete indent");
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      SUBMITTED: "badge-submitted",
      CPO_RECEIVED: "badge-received",
      PROCESSING: "badge-pending",
      CLOSED: "badge-closed",
      DRAFT: "bg-gray-100 text-gray-600",
    };
    return map[status] || "bg-gray-100 text-gray-600";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-amu-green">My Indents</h1>
          <p className="text-sm text-gray-400">
            View and track your submitted purchase requests
          </p>
        </div>
        {(!isIndentEnabled && role === "DEPT_USER") ? null : (
          <Link
            href="/indents/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amu-gold text-amu-green font-semibold hover:bg-amu-gold-light transition-all shadow-sm"
          >
            + New Indent
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by Requisition No..."
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amu-green/20 bg-white text-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <FileText size={40} className="mx-auto mb-2 opacity-30" />
            <p>No indents found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 text-gray-500 font-medium">Req. No.</th>
                  <th className="text-left p-3 text-gray-500 font-medium">Date</th>
                  <th className="text-center p-3 text-gray-500 font-medium">Items</th>
                  <th className="text-center p-3 text-gray-500 font-medium">Urgency</th>
                  <th className="text-center p-3 text-gray-500 font-medium">Status</th>
                  <th className="text-left p-3 text-gray-500 font-medium">Receipt No.</th>
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
                        year: "numeric",
                      })}
                    </td>
                    <td className="p-3 text-center">{indent._count.items}</td>
                    <td className="p-3 text-center">
                      {indent.urgency === "URGENT" ? (
                        <span className="badge-urgent px-2 py-0.5 rounded-full text-xs font-medium">
                          URGENT
                        </span>
                      ) : (
                        <span className="text-gray-400">Normal</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge(indent.status)}`}
                      >
                        {indent.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-xs">
                      {indent.receiptNo || "—"}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/indents/${indent.id}`}
                          className="p-1.5 rounded-lg hover:bg-amu-green/10 text-amu-green"
                          title="View"
                        >
                          <Eye size={16} />
                        </Link>
                        <Link
                          href={`/indents/${indent.id}/print`}
                          className="p-1.5 rounded-lg hover:bg-amu-gold/10 text-amu-gold"
                          title="Print"
                        >
                          <Printer size={16} />
                        </Link>
                        {indent.status === "DRAFT" && (
                          <button
                            onClick={() => handleDelete(indent.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                            title="Delete Draft"
                          >
                            <Trash2 size={16} />
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
    </div>
  );
}
