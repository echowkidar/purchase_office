"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Printer,
  ArrowLeft,
  CheckCircle,
  Clock,
  FileText,
  Upload,
  Loader2,
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
  const [indent, setIndent] = useState<IndentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch(`/api/indents/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setIndent(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

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
        <Link
          href={`/indents/${indent.id}/print`}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amu-gold text-amu-green font-semibold hover:bg-amu-gold-light transition-all shadow-sm"
        >
          <Printer size={16} /> Print / Download
        </Link>
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

      {/* Upload Signed Copy Section */}
      {indent.status === "DRAFT" && (
        <div className="bg-amber-50 rounded-xl shadow-sm border border-amber-200 p-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in">
          <div>
            <h3 className="font-bold text-amber-800 flex items-center gap-2">
              <FileText size={18} /> Action Required: Upload Signed Copy
            </h3>
            <p className="text-amber-700 text-sm mt-1">
              Please print this indent, sign it, and upload the scanned PDF copy to finalize submission to CPO.
            </p>
          </div>
          <div className="flex-shrink-0">
            <input
              type="file"
              id="upload-signed-pdf"
              className="hidden"
              accept=".pdf,image/png,image/jpeg"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploading(true);
                const formData = new FormData();
                formData.append("file", file);
                try {
                  const res = await fetch(`/api/indents/${indent.id}/upload`, {
                    method: "POST",
                    body: formData,
                  });
                  if (res.ok) {
                    window.location.reload();
                  } else {
                    alert("Upload failed. Try again.");
                  }
                } catch {
                  alert("Upload failed. Try again.");
                } finally {
                  setUploading(false);
                }
              }}
            />
            <label
              htmlFor="upload-signed-pdf"
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all shadow-md cursor-pointer ${
                uploading
                  ? "bg-gray-400 text-white cursor-not-allowed opacity-70"
                  : "bg-amu-gold text-amu-green hover:bg-amu-gold-light"
              }`}
            >
              {uploading ? (
                <><Loader2 size={16} className="animate-spin" /> Uploading...</>
              ) : (
                <><Upload size={16} /> Upload Signed Indent</>
              )}
            </label>
          </div>
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
