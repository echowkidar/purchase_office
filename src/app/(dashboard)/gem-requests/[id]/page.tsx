"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  IdCard,
  ChevronRight,
  Printer,
  CheckCircle2,
  Clock,
  Loader2,
  XCircle,
  FileText,
  Eye,
  EyeOff,
  Mail,
} from "lucide-react";

interface GemRequest {
  id: string;
  requisitionNo: string;
  requestType: "CREATE" | "REPLACE";
  status: "DRAFT" | "SUBMITTED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED";
  unitName: string;
  userName: string;
  institutionalEmail: string;
  mobileNumber: string;
  dateOfBirth?: string;
  dateOfRetirement?: string;
  roleToAssign: string;
  hasExistingNicEmail: boolean;
  existingNicEmail?: string;
  oldGemId?: string;
  lastUserName?: string;
  idRequiredFor?: string;
  projectName?: string;
  fundedBy?: string;
  projectCode?: string;
  hodName?: string;
  hodDesignation?: string;
  hodPhone?: string;
  afoRemarks?: string;
  gemLoginId?: string;
  gemPassword?: string;
  gemRole?: string;
  credentialEmailSentAt?: string;
  rejectedReason?: string;
  processedAt?: string;
  createdAt: string;
  department: { name: string; code: string };
  requestedBy: { name: string; email: string; designation?: string };
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  SUBMITTED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

const TIMELINE = ["SUBMITTED", "IN_PROGRESS", "COMPLETED"];

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs font-medium text-gray-500 sm:w-44 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-800">{value}</span>
    </div>
  );
}

export default function GemRequestDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [req, setReq] = useState<GemRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetch(`/api/gem-requests/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setReq(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-400">
        <Loader2 size={32} className="animate-spin mx-auto mb-2" />
        <p>Loading request...</p>
      </div>
    );
  }

  if (!req) {
    return (
      <div className="p-12 text-center text-gray-400">
        <XCircle size={32} className="mx-auto mb-2" />
        <p>Request not found</p>
      </div>
    );
  }

  const timelineStep = TIMELINE.indexOf(req.status);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/gem-requests" className="hover:text-amu-green transition-colors">
          GeM Requests
        </Link>
        <ChevronRight size={14} />
        <span className="text-amu-green font-mono font-medium">{req.requisitionNo}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amu-green/10 flex items-center justify-center text-amu-green">
              <IdCard size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-amu-green font-mono">{req.requisitionNo}</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {req.requestType === "CREATE" ? "New GeM ID Creation" : "GeM ID Replacement"} •{" "}
                {new Date(req.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${STATUS_STYLES[req.status]}`}
            >
              {req.status === "COMPLETED" ? <CheckCircle2 size={14} /> :
               req.status === "REJECTED" ? <XCircle size={14} /> :
               req.status === "IN_PROGRESS" ? <Loader2 size={14} className="animate-spin" /> :
               <Clock size={14} />}
              {req.status.replace("_", " ")}
            </span>
            {(req.status === "SUBMITTED" || req.status === "COMPLETED") && (
              <Link
                href={`/gem-requests/${req.id}/print`}
                target="_blank"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-all"
              >
                <Printer size={14} />
                Print
              </Link>
            )}
          </div>
        </div>

        {/* Status Timeline */}
        {req.status !== "DRAFT" && req.status !== "REJECTED" && (
          <div className="mt-6 flex items-center gap-0">
            {TIMELINE.map((step, idx) => {
              const isCompleted = timelineStep > idx;
              const isCurrent = timelineStep === idx;
              return (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div
                    className={`flex flex-col items-center ${idx < TIMELINE.length - 1 ? "flex-1" : ""}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                        isCompleted
                          ? "bg-amu-green border-amu-green text-white"
                          : isCurrent
                          ? "border-amu-green text-amu-green bg-amu-green/10"
                          : "border-gray-200 text-gray-300 bg-white"
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 size={16} /> : idx + 1}
                    </div>
                    <p
                      className={`text-[10px] mt-1 font-medium ${
                        isCompleted || isCurrent ? "text-amu-green" : "text-gray-300"
                      }`}
                    >
                      {step.replace("_", " ")}
                    </p>
                  </div>
                  {idx < TIMELINE.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-1 mb-4 transition-all ${
                        timelineStep > idx ? "bg-amu-green" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Request Details */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-1">
        <h2 className="text-sm font-semibold text-amu-green mb-3 pb-2 border-b">Request Details</h2>
        <InfoRow label="Department" value={req.department.name} />
        <InfoRow label="Requested By" value={req.requestedBy.name} />
        <InfoRow label="Name of Unit" value={req.unitName} />
        <InfoRow label="Name of User" value={req.userName} />
        <InfoRow label="Institutional Email" value={req.institutionalEmail} />
        <InfoRow label="Mobile Number" value={req.mobileNumber} />
        <InfoRow label="Date of Birth" value={req.dateOfBirth} />
        <InfoRow label="Date of Retirement" value={req.dateOfRetirement} />
        <InfoRow label="Role to Assign" value={req.roleToAssign} />
        <InfoRow label="Has Existing NIC Email" value={req.hasExistingNicEmail ? "Yes" : "No"} />
        <InfoRow label="Existing NIC Email" value={req.existingNicEmail} />
        <InfoRow label="Purpose / ID Required For" value={req.idRequiredFor} />
        {req.requestType === "REPLACE" && (
          <>
            <InfoRow label="Old GeM ID" value={req.oldGemId} />
            <InfoRow label="Previous User Name" value={req.lastUserName} />
          </>
        )}
        <InfoRow label="Project Name" value={req.projectName} />
        <InfoRow label="Funded By" value={req.fundedBy} />
        <InfoRow label="Project Code" value={req.projectCode} />
        <InfoRow label="HoD Name" value={req.hodName} />
        <InfoRow label="HoD Designation" value={req.hodDesignation} />
        <InfoRow label="HoD Phone/Extension" value={req.hodPhone} />
      </div>

      {/* AFO Remarks */}
      {req.afoRemarks && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-800 mb-1">AFO Remarks</p>
          <p className="text-sm text-amber-700">{req.afoRemarks}</p>
        </div>
      )}

      {/* Rejection Reason */}
      {req.status === "REJECTED" && req.rejectedReason && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-red-800 mb-1 flex items-center gap-2">
            <XCircle size={14} /> Rejection Reason
          </p>
          <p className="text-sm text-red-700">{req.rejectedReason}</p>
        </div>
      )}

      {/* Credentials Section — only for COMPLETED */}
      {req.status === "COMPLETED" && req.gemLoginId && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 space-y-3">
          <h2 className="text-sm font-semibold text-green-800 flex items-center gap-2">
            <CheckCircle2 size={16} />
            GeM Portal Credentials
          </h2>
          <div className="space-y-2">
            <InfoRow label="GeM Login ID" value={req.gemLoginId} />
            <InfoRow label="GeM Role Assigned" value={req.gemRole} />
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-2">
              <span className="text-xs font-medium text-gray-500 sm:w-44">GeM Password</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono bg-white px-3 py-1 rounded border border-green-200">
                  {showPassword ? req.gemPassword : "••••••••"}
                </span>
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-green-700 hover:text-green-900"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>
          {req.credentialEmailSentAt && (
            <div className="flex items-center gap-2 text-xs text-green-700 pt-2 border-t border-green-200">
              <Mail size={12} />
              Credentials emailed on{" "}
              {new Date(req.credentialEmailSentAt).toLocaleString("en-IN")}
            </div>
          )}
          <a
            href="https://gem.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-amu-green text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amu-green-mid transition-all"
          >
            <FileText size={14} />
            Login to GeM Portal
          </a>
        </div>
      )}
    </div>
  );
}
