"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Printer,
  ArrowLeft,
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  Send,
  Pencil,
} from "lucide-react";

interface IndentDetail {
  id: string;
  requisitionNo: string;
  purpose: string;
  urgency: string;
  status: string;
  createdAt: string;
  receiptNo?: string;
  receiptDate?: string;
  requestedById: string;
  department: { name: string; code: string };
  requestedBy: { name: string; designation: string };
  items: {
    id: string;
    quantity: number;
    variantId?: string;
    year1Label?: string;
    year1Qty?: number;
    year2Label?: string;
    year2Qty?: number;
    year3Label?: string;
    year3Qty?: number;
    remarks?: string;
    usedByName?: string;
    item: {
      name: string;
      itemCode: string;
      category: { name: string };
      variants: { id: string; label: string }[];
    };
  }[];
}

export default function IndentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [indent, setIndent] = useState<IndentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/indents/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setIndent(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const role = session?.user?.role;
  const userId = session?.user?.id;

  // Check if current user can edit this indent
  const canEdit =
    indent &&
    ((role === "DEPT_USER" && indent.status === "DRAFT") ||
      ((role === "AFO_STAFF" || role === "SUPER_ADMIN") &&
        (indent.status === "CPO_RECEIVED" || indent.status === "DRAFT" || indent.status === "SUBMITTED")));

  // Check if current user can submit (DRAFT → SUBMITTED)
  const canSubmit =
    indent &&
    indent.status === "DRAFT" &&
    (role === "DEPT_USER" || role === "AFO_STAFF" || role === "SUPER_ADMIN");

  const handleFinalSubmit = async () => {
    if (
      !confirm(
        "Are you sure you want to submit this indent?\n\nOnce submitted, the indent will be sent to CPO for processing. This action cannot be undone."
      )
    )
      return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/indents/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SUBMITTED" }),
      });
      if (res.ok) {
        // Reload to show updated status
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to submit indent");
      }
    } catch {
      alert("Failed to submit. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading...
      </div>
    );
  }

  if (!indent) {
    return (
      <div className="text-center py-16">
        <FileText size={48} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-400">Indent not found</p>
      </div>
    );
  }

  const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
    DRAFT: {
      color: "bg-gray-100 text-gray-600",
      icon: <FileText size={14} />,
    },
    SUBMITTED: {
      color: "badge-submitted",
      icon: <Clock size={14} />,
    },
    CPO_RECEIVED: {
      color: "badge-received",
      icon: <CheckCircle size={14} />,
    },
  };

  const sc = statusConfig[indent.status] || {
    color: "bg-gray-100 text-gray-600",
    icon: null,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/indents"
          className="flex items-center gap-2 text-gray-400 hover:text-amu-green transition-colors text-sm"
        >
          <ArrowLeft size={16} /> Back to Indents
        </Link>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Link
              href={`/indents/${indent.id}/edit`}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-amu-green/20 text-amu-green font-semibold hover:bg-amu-green/5 transition-all text-sm"
            >
              <Pencil size={16} /> Edit
            </Link>
          )}
          <Link
            href={`/indents/${indent.id}/print`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amu-gold text-amu-green font-semibold hover:bg-amu-gold-light transition-all shadow-sm"
          >
            <Printer size={16} /> Print / Download
          </Link>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-amu-green font-mono">
              {indent.requisitionNo}
            </h1>
            <p className="text-sm text-gray-400">
              {new Date(indent.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${sc.color}`}
          >
            {sc.icon} {indent.status.replace("_", " ")}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Department:</span>
            <p className="font-medium">{indent.department.name}</p>
          </div>
          <div>
            <span className="text-gray-400">Requested By:</span>
            <p className="font-medium">
              {indent.requestedBy?.name} ({indent.requestedBy?.designation})
            </p>
          </div>
          <div>
            <span className="text-gray-400">Urgency:</span>
            <p className={indent.urgency === "URGENT" ? "text-red-600 font-bold" : ""}>
              {indent.urgency}
            </p>
          </div>
          {indent.receiptNo && (
            <div>
              <span className="text-gray-400">CPO Receipt No:</span>
              <p className="font-mono font-medium text-status-received">
                {indent.receiptNo} (
                {indent.receiptDate &&
                  new Date(indent.receiptDate).toLocaleDateString("en-IN")}
                )
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <span className="text-gray-400 text-sm">Purpose / Justification:</span>
          <p className="mt-1 text-gray-700">{indent.purpose}</p>
        </div>
      </div>

      {/* Final Submit Section for DRAFT indents */}
      {canSubmit && (
        <div className="bg-emerald-50 rounded-xl shadow-sm border border-emerald-200 p-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in">
          <div>
            <h3 className="font-bold text-emerald-800 flex items-center gap-2">
              <Send size={18} /> Ready to Submit?
            </h3>
            <p className="text-emerald-700 text-sm mt-1">
              Review all details above. Once submitted, this indent will be sent to CPO for processing.
            </p>
          </div>
          <button
            onClick={handleFinalSubmit}
            disabled={submitting}
            className={`flex items-center gap-2 px-8 py-3 rounded-lg font-bold transition-all shadow-md ${
              submitting
                ? "bg-gray-400 text-white cursor-not-allowed opacity-70"
                : "bg-amu-green text-white hover:bg-amu-green-mid hover:shadow-lg transform hover:-translate-y-0.5"
            }`}
          >
            {submitting ? (
              <><Loader2 size={16} className="animate-spin" /> Submitting...</>
            ) : (
              <><Send size={16} /> Submit Indent</>
            )}
          </button>
        </div>
      )}

      {/* Items Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-amu-green">
            Items Requested ({indent.items.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 text-gray-500 font-medium">S.No</th>
                <th className="text-left p-3 text-gray-500 font-medium">Item Name</th>
                <th className="text-left p-3 text-gray-500 font-medium">Category</th>
                <th className="text-left p-3 text-gray-500 font-medium">Variant</th>
                <th className="text-center p-3 text-gray-500 font-medium">Qty</th>
                <th className="text-center p-3 text-gray-500 font-medium">
                  {indent.items[0]?.year1Label || "Year 1"}
                </th>
                <th className="text-center p-3 text-gray-500 font-medium">
                  {indent.items[0]?.year2Label || "Year 2"}
                </th>
                <th className="text-center p-3 text-gray-500 font-medium">
                  {indent.items[0]?.year3Label || "Year 3"}
                </th>
                <th className="text-left p-3 text-gray-500 font-medium">Remarks</th>
                <th className="text-left p-3 text-gray-500 font-medium">Used By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {indent.items.map((indentItem, idx) => {
                const variant = indentItem.item.variants.find(
                  (v) => v.id === indentItem.variantId
                );
                return (
                  <tr key={indentItem.id}>
                    <td className="p-3">{idx + 1}</td>
                    <td className="p-3 font-medium text-amu-green">
                      {indentItem.item.name}
                    </td>
                    <td className="p-3 text-gray-500">
                      {indentItem.item.category.name}
                    </td>
                    <td className="p-3 text-gray-500">
                      {variant?.label || "—"}
                    </td>
                    <td className="p-3 text-center font-mono font-medium">
                      {indentItem.quantity}
                    </td>
                    <td className="p-3 text-center font-mono">
                      {indentItem.year1Qty ?? 0}
                    </td>
                    <td className="p-3 text-center font-mono">
                      {indentItem.year2Qty ?? 0}
                    </td>
                    <td className="p-3 text-center font-mono">
                      {indentItem.year3Qty ?? 0}
                    </td>
                    <td className="p-3 text-gray-500 text-xs">
                      {indentItem.remarks || "—"}
                    </td>
                    <td className="p-3 text-gray-500 text-xs">
                      {indentItem.usedByName || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
