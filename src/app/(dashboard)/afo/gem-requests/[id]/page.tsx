"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  IdCard,
  ChevronRight,
  CheckCircle2,
  Clock,
  Loader2,
  XCircle,
  Mail,
  Save,
  Send,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";

interface GemRequest {
  id: string;
  requisitionNo: string;
  requestType: "CREATE" | "REPLACE";
  status: "DRAFT" | "SUBMITTED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED";
  unitName: string;
  userName: string;
  userDesignation?: string;
  institutionalEmail: string;
  mobileNumber: string;
  aadharNumber?: string;
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

function InfoRow({ label, value }: { label: string; value?: string | null | boolean }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs font-medium text-gray-500 sm:w-44 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-800">{String(value)}</span>
    </div>
  );
}

export default function AFOGemRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [req, setReq] = useState<GemRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingCreds, setSendingCreds] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // AFO action state
  const [status, setStatus] = useState("");
  const [afoRemarks, setAfoRemarks] = useState("");
  const [rejectedReason, setRejectedReason] = useState("");
  const [gemLoginId, setGemLoginId] = useState("");
  const [gemPassword, setGemPassword] = useState("");
  const [gemRole, setGemRole] = useState("");

  const fetchRequest = () => {
    fetch(`/api/gem-requests/${id}`)
      .then((r) => r.json())
      .then((data: GemRequest) => {
        setReq(data);
        setStatus(data.status);
        setAfoRemarks(data.afoRemarks || "");
        setRejectedReason(data.rejectedReason || "");
        setGemLoginId(data.gemLoginId || "");
        setGemPassword(data.gemPassword || "");
        setGemRole(data.gemRole || data.roleToAssign || "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequest();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    const payload: Record<string, unknown> = {
      status,
      afoRemarks,
    };

    if (status === "REJECTED") payload.rejectedReason = rejectedReason;
    if (status === "COMPLETED" || status === "IN_PROGRESS") {
      payload.gemLoginId = gemLoginId;
      payload.gemPassword = gemPassword;
      payload.gemRole = gemRole;
    }

    const res = await fetch(`/api/gem-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setSuccess("Changes saved successfully.");
      fetchRequest();
    } else {
      const d = await res.json();
      setError(d.error || "Failed to save");
    }
    setSaving(false);
  };

  const handleSendCredentials = async () => {
    if (!gemLoginId) {
      setError("Please fill the GeM Login ID before sending credentials.");
      return;
    }
    setSendingCreds(true);
    setError("");
    setSuccess("");

    // Save credentials first
    await fetch(`/api/gem-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "COMPLETED",
        gemLoginId,
        gemPassword,
        gemRole,
        afoRemarks,
      }),
    });

    const res = await fetch(`/api/gem-requests/${id}/send-credentials`, {
      method: "POST",
    });

    if (res.ok) {
      setSuccess("✅ Credentials emailed successfully! Status set to COMPLETED.");
      fetchRequest();
    } else {
      const d = await res.json();
      setError(d.error || "Failed to send credentials");
    }
    setSendingCreds(false);
  };

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
        <Link href="/afo/gem-requests" className="text-amu-gold text-sm mt-2 inline-block">
          ← Back to list
        </Link>
      </div>
    );
  }

  const inputClass =
    "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amu-green/20 focus:border-amu-green/40 transition-all";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in pb-10">
      {/* Left column — Request details (2/3) */}
      <div className="lg:col-span-2 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/afo/gem-requests" className="hover:text-amu-green">GeM Requests</Link>
          <ChevronRight size={14} />
          <span className="text-amu-green font-mono font-medium">{req.requisitionNo}</span>
        </div>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amu-green/10 flex items-center justify-center text-amu-green">
              <IdCard size={24} />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-amu-green font-mono">{req.requisitionNo}</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {req.requestType === "CREATE" ? "New GeM ID Creation" : "GeM ID Replacement"} •{" "}
                {req.department.name} •{" "}
                {new Date(req.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_STYLES[req.status]}`}
            >
              {req.status.replace("_", " ")}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-1">
          <h2 className="text-sm font-semibold text-amu-green mb-3 pb-2 border-b">
            Request Details
          </h2>
          <InfoRow label="Department" value={req.department.name} />
          <InfoRow label="Requested By" value={req.requestedBy.name} />
          <InfoRow label="Requestor Email" value={req.requestedBy.email} />
          <InfoRow label="Name of Unit" value={req.unitName} />
          <InfoRow label="Name of User" value={req.userName} />
          <InfoRow label="User Designation" value={req.userDesignation} />
          <InfoRow label="Institutional Email" value={req.institutionalEmail} />
          <InfoRow label="Mobile Number" value={req.mobileNumber} />
          <InfoRow label="Aadhar Number" value={req.aadharNumber} />
          <InfoRow label="Date of Birth" value={req.dateOfBirth} />
          <InfoRow label="Date of Retirement" value={req.dateOfRetirement} />
          <InfoRow label="Role to Assign" value={req.roleToAssign} />
          <InfoRow label="Existing NIC Email" value={req.hasExistingNicEmail ? req.existingNicEmail || "Yes" : "No"} />
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
          <InfoRow label="HoD Phone/Ext" value={req.hodPhone} />
        </div>

        {/* Credential Summary if completed */}
        {req.credentialEmailSentAt && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <Mail size={18} className="text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800">Credentials Sent</p>
              <p className="text-xs text-green-700">
                Emailed to {req.institutionalEmail} on{" "}
                {new Date(req.credentialEmailSentAt).toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Right column — AFO Action Panel (1/3) */}
      <div className="space-y-4">
        {/* Messages */}
        {success && (
          <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-xl p-3">
            <CheckCircle2 size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
            <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Status Updater */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-amu-green border-b pb-2">
            AFO Action Panel
          </h3>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={inputClass}
            >
              <option value="SUBMITTED">Submitted</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">AFO Remarks</label>
            <textarea
              value={afoRemarks}
              onChange={(e) => setAfoRemarks(e.target.value)}
              rows={3}
              placeholder="Internal notes or remarks..."
              className={inputClass}
            />
          </div>

          {/* Rejection reason */}
          {status === "REJECTED" && (
            <div>
              <label className="block text-xs font-medium text-red-600 mb-1">
                Rejection Reason *
              </label>
              <textarea
                value={rejectedReason}
                onChange={(e) => setRejectedReason(e.target.value)}
                rows={3}
                placeholder="Reason for rejection..."
                className={`${inputClass} border-red-200 focus:border-red-400`}
              />
            </div>
          )}

          {/* Credential fields */}
          {(status === "IN_PROGRESS" || status === "COMPLETED") && (
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <p className="text-xs font-semibold text-amu-green uppercase tracking-wider">
                GeM Credentials
              </p>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  GeM Login ID (Email) *
                </label>
                <input
                  type="email"
                  value={gemLoginId}
                  onChange={(e) => setGemLoginId(e.target.value)}
                  placeholder="user@gem.gov.in"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Initial Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={gemPassword}
                    onChange={(e) => setGemPassword(e.target.value)}
                    placeholder="Initial password"
                    className={`${inputClass} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  GeM Role Assigned
                </label>
                <input
                  type="text"
                  value={gemRole}
                  onChange={(e) => setGemRole(e.target.value)}
                  placeholder="Role assigned on GeM portal"
                  className={inputClass}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amu-green text-white text-sm font-medium hover:bg-amu-green-mid disabled:opacity-50 transition-all"
          >
            <Save size={14} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* Send Credentials Panel */}
        {(status === "IN_PROGRESS" || status === "COMPLETED" || req.status === "IN_PROGRESS") && (
          <div className="bg-white rounded-xl shadow-sm border border-green-200 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-green-800 flex items-center gap-2">
              <Mail size={14} />
              Send Credentials to Department
            </h3>
            <p className="text-xs text-gray-500">
              This will email the GeM Login ID and password to{" "}
              <strong>{req.institutionalEmail}</strong> and mark the request as COMPLETED.
            </p>
            {req.credentialEmailSentAt && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle2 size={12} />
                Last sent: {new Date(req.credentialEmailSentAt).toLocaleString("en-IN")}
              </p>
            )}
            <button
              onClick={handleSendCredentials}
              disabled={sendingCreds || !gemLoginId}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-all"
            >
              {sendingCreds ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
              {sendingCreds ? "Sending..." : "Send Credentials Email"}
            </button>
            {!gemLoginId && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <Clock size={12} />
                Fill GeM Login ID above first
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
