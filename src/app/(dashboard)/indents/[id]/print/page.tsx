"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Download, Printer } from "lucide-react";

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
      category: { name: string };
      variants: { id: string; label: string }[];
    };
  }[];
}

export default function PrintLetterPage() {
  const { id } = useParams();
  const [indent, setIndent] = useState<IndentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/indents/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setIndent(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (!indent) return <div className="text-center py-8">Indent not found</div>;

  const isReceived = indent.status === "CPO_RECEIVED" || indent.status === "PROCESSING" || indent.status === "CLOSED";

  return (
    <div className="max-w-4xl mx-auto">
      {/* Action Bar (no-print) */}
      <div className="no-print flex items-center justify-between mb-6">
        <Link
          href={`/indents/${indent.id}`}
          className="flex items-center gap-2 text-gray-400 hover:text-amu-green text-sm"
        >
          <ArrowLeft size={16} /> Back
        </Link>
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amu-green text-white font-medium hover:bg-amu-green-mid transition-all"
          >
            <Printer size={16} /> Print
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amu-gold text-amu-green font-medium hover:bg-amu-gold-light transition-all"
          >
            <Download size={16} /> Save as PDF
          </button>
        </div>
      </div>

      {/* Official Letter */}
      <div className="print-area bg-white shadow-lg rounded-xl overflow-hidden" style={{ fontFamily: "'Source Sans 3', 'Segoe UI', sans-serif" }}>
        {/* Watermark */}
        <div className="relative">
          {!isReceived && (
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none opacity-10">
              <span className="text-6xl font-bold text-red-500 rotate-[-30deg]">
                SENT TO CPO
              </span>
            </div>
          )}
          {isReceived && indent.receiptNo && (
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none opacity-10">
              <span className="text-4xl font-bold text-green-600 rotate-[-30deg] text-center leading-tight">
                RECEIVED BY CPO<br />
                vide R.No. {indent.receiptNo}<br />
                dated {indent.receiptDate
                  ? new Date(indent.receiptDate).toLocaleDateString("en-IN")
                  : ""}
              </span>
            </div>
          )}

          {/* Letterhead */}
          <div className="border-b-4 border-amu-green px-8 py-6">
            <div className="flex items-center justify-center gap-6">
              <Image
                src="/logo/android-chrome-192x192.png"
                alt="AMU Logo"
                width={70}
                height={70}
                className="rounded-full"
              />
              <div className="text-center">
                <h1 className="text-3xl font-bold text-amu-green uppercase tracking-wide" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  CENTRAL PURCHASE OFFICE
                </h1>
                <p className="text-lg font-medium text-gray-700 mt-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  Aligarh Muslim University, Aligarh
                </p>
              </div>
            </div>
          </div>

          {/* Letter Content */}
          <div className="px-8 py-6 space-y-6 relative z-0">
            {/* Requisition Info */}
            <div className="flex justify-between text-sm">
              <div>
                <span className="text-gray-500">Requisition No.: </span>
                <span className="font-mono font-bold">{indent.requisitionNo}</span>
              </div>
              <div>
                <span className="text-gray-500">Date: </span>
                <span className="font-medium">
                  {new Date(indent.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            {/* Receipt Info (if received) */}
            {isReceived && indent.receiptNo && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                <span className="text-green-700 font-medium">
                  CPO Receipt No: {indent.receiptNo} | Date:{" "}
                  {indent.receiptDate
                    ? new Date(indent.receiptDate).toLocaleDateString("en-IN")
                    : "—"}
                </span>
              </div>
            )}

            {/* To */}
            <div className="text-sm leading-relaxed">
              <p>To,</p>
              <p className="font-medium mt-1">
                The Assistant Finance Officer (Purchase),
              </p>
              <p>Central Purchase Office,</p>
              <p>Aligarh Muslim University,</p>
              <p>Aligarh</p>
            </div>

            {/* Subject */}
            <div className="text-sm">
              <p>
                <span className="font-bold">Subject: </span>
                Requisition for Purchase of Items for the Department of{" "}
                {indent.department.name}
              </p>
            </div>

            {/* Body */}
            <div className="text-sm leading-relaxed">
              <p className="mt-2">
                Kindly arrange to purchase the following items for the Department
                of {indent.department.name} as per the details given below:
              </p>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 text-left">S.No</th>
                    <th className="border border-gray-300 p-2 text-left">Item Name</th>
                    <th className="border border-gray-300 p-2 text-left">Category</th>
                    <th className="border border-gray-300 p-2 text-left">Variant</th>
                    <th className="border border-gray-300 p-2 text-center">Qty</th>
                    <th className="border border-gray-300 p-2 text-center">
                      {indent.items[0]?.year1Label || "Yr 1"}
                    </th>
                    <th className="border border-gray-300 p-2 text-center">
                      {indent.items[0]?.year2Label || "Yr 2"}
                    </th>
                    <th className="border border-gray-300 p-2 text-center">
                      {indent.items[0]?.year3Label || "Yr 3"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {indent.items.map((indentItem, idx) => {
                    const variant = indentItem.item.variants.find(
                      (v) => v.id === indentItem.variantId
                    );
                    return (
                      <tr key={indentItem.id}>
                        <td className="border border-gray-300 p-2">{idx + 1}</td>
                        <td className="border border-gray-300 p-2 font-medium">
                          {indentItem.item.name}
                        </td>
                        <td className="border border-gray-300 p-2">
                          {indentItem.item.category.name}
                        </td>
                        <td className="border border-gray-300 p-2">
                          {variant?.label || "—"}
                        </td>
                        <td className="border border-gray-300 p-2 text-center font-mono font-bold">
                          {indentItem.quantity}
                        </td>
                        <td className="border border-gray-300 p-2 text-center font-mono">
                          {indentItem.year1Qty ?? 0}
                        </td>
                        <td className="border border-gray-300 p-2 text-center font-mono">
                          {indentItem.year2Qty ?? 0}
                        </td>
                        <td className="border border-gray-300 p-2 text-center font-mono">
                          {indentItem.year3Qty ?? 0}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Purpose */}
            <div className="text-sm">
              <p className="font-bold">Purpose/Justification:</p>
              <p className="mt-1">{indent.purpose}</p>
            </div>

            {/* Signature */}
            <div className="text-sm mt-12">
              <p>Thanking you,</p>
              <p className="mt-1">Yours faithfully,</p>
              <div className="mt-12">
                <p className="font-bold">({indent.requestedBy?.name})</p>
                <p>{indent.requestedBy?.designation}</p>
                <p>Department of {indent.department.name}</p>
                <p>Aligarh Muslim University, Aligarh</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
