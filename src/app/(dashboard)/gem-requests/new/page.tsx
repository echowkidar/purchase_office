"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  IdCard,
  ChevronRight,
  Save,
  Send,
  AlertCircle,
  CheckSquare,
} from "lucide-react";

const GEM_ROLES = [
  "Primary Buyer",
  "Secondary Buyer",
  "Consignee",
  "PAO (Payment Authority)",
  "GeM Admin",
  "Other",
];

const UNDERTAKING_TEXT = `I/We hereby undertake that:
1. The above-mentioned user is a bonafide employee of this department/office.
2. The GeM Portal User ID being requested shall be used exclusively for official procurement purposes only.
3. The department shall immediately inform the Central Purchase Office in case of retirement, transfer, resignation, or any other change of status of the above user.
4. The department shall be responsible for all transactions made using this User ID.
5. The details provided above are correct to the best of my/our knowledge.`;

interface FormData {
  requestType: "CREATE" | "REPLACE";
  unitName: string;
  userName: string;
  institutionalEmail: string;
  mobileNumber: string;
  dateOfBirth: string;
  dateOfRetirement: string;
  roleToAssign: string;
  hasExistingNicEmail: boolean;
  existingNicEmail: string;
  oldGemId: string;
  lastUserName: string;
  idRequiredFor: string;
  projectName: string;
  fundedBy: string;
  projectCode: string;
  hodName: string;
  hodDesignation: string;
  hodPhone: string;
}

export default function NewGemRequestPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [undertakingAccepted, setUndertakingAccepted] = useState(false);

  const [form, setForm] = useState<FormData>({
    requestType: "CREATE",
    unitName: "",
    userName: "",
    institutionalEmail: "",
    mobileNumber: "",
    dateOfBirth: "",
    dateOfRetirement: "",
    roleToAssign: "",
    hasExistingNicEmail: false,
    existingNicEmail: "",
    oldGemId: "",
    lastUserName: "",
    idRequiredFor: "",
    projectName: "",
    fundedBy: "",
    projectCode: "",
    hodName: "",
    hodDesignation: "",
    hodPhone: "",
  });

  const update = (field: keyof FormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (status: "DRAFT" | "SUBMITTED") => {
    if (status === "SUBMITTED") {
      if (!form.unitName || !form.userName || !form.institutionalEmail || !form.mobileNumber || !form.roleToAssign) {
        setError("Please fill all required fields before submitting.");
        return;
      }
      if (!undertakingAccepted) {
        setError("Please accept the undertaking before submitting.");
        return;
      }
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/gem-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, status }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to submit request");
        setSubmitting(false);
        return;
      }

      const data = await res.json();
      router.push(`/gem-requests/${data.id}`);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amu-green/20 focus:border-amu-green/40 transition-all";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const sectionClass = "bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4";

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>GeM Requests</span>
        <ChevronRight size={14} />
        <span className="text-amu-green font-medium">New Request</span>
      </div>

      <div className="bg-gradient-to-r from-amu-green to-amu-green-mid rounded-2xl p-6 text-white shadow-lg flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
          <IdCard size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold">New GeM Portal ID Request</h1>
          <p className="text-white/70 text-sm mt-0.5">
            {session?.user?.departmentName} — {session?.user?.name}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-xl p-4">
          <AlertCircle size={18} />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Section 1: Request Type */}
      <div className={sectionClass}>
        <h2 className="text-base font-semibold text-amu-green border-b pb-2">
          Section 1 — Request Type
        </h2>
        <div>
          <label className={labelClass}>Request Type *</label>
          <div className="flex gap-3">
            {(["CREATE", "REPLACE"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => update("requestType", type)}
                className={`flex-1 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                  form.requestType === type
                    ? "border-amu-green bg-amu-green/5 text-amu-green"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                {type === "CREATE" ? "🆕 Create New ID" : "🔄 Replace Existing ID"}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={labelClass}>ID Required For (Purpose)</label>
          <input
            type="text"
            value={form.idRequiredFor}
            onChange={(e) => update("idRequiredFor", e.target.value)}
            placeholder="e.g. Official procurement activities"
            className={inputClass}
          />
        </div>
      </div>

      {/* Section 2: User Details */}
      <div className={sectionClass}>
        <h2 className="text-base font-semibold text-amu-green border-b pb-2">
          Section 2 — User Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Name of Unit / Department *</label>
            <input
              type="text"
              value={form.unitName}
              onChange={(e) => update("unitName", e.target.value)}
              placeholder="e.g. Department of Computer Science"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Name of User *</label>
            <input
              type="text"
              value={form.userName}
              onChange={(e) => update("userName", e.target.value)}
              placeholder="Full name of the user"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Institutional Email ID *</label>
            <input
              type="email"
              value={form.institutionalEmail}
              onChange={(e) => update("institutionalEmail", e.target.value)}
              placeholder="user@amu.ac.in"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Mobile Number *</label>
            <input
              type="tel"
              value={form.mobileNumber}
              onChange={(e) => update("mobileNumber", e.target.value)}
              placeholder="10-digit mobile number"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Date of Birth</label>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => update("dateOfBirth", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Date of Retirement</label>
            <input
              type="date"
              value={form.dateOfRetirement}
              onChange={(e) => update("dateOfRetirement", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Role to Assign on GeM *</label>
            <select
              value={form.roleToAssign}
              onChange={(e) => update("roleToAssign", e.target.value)}
              className={inputClass}
            >
              <option value="">Select role...</option>
              {GEM_ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Has Existing Govt./NIC Email?</label>
            <div className="flex gap-3 mt-1">
              {[true, false].map((val) => (
                <button
                  key={String(val)}
                  type="button"
                  onClick={() => update("hasExistingNicEmail", val)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                    form.hasExistingNicEmail === val
                      ? "border-amu-green bg-amu-green/5 text-amu-green"
                      : "border-gray-200 text-gray-500"
                  }`}
                >
                  {val ? "Yes" : "No"}
                </button>
              ))}
            </div>
          </div>
        </div>
        {form.hasExistingNicEmail && (
          <div>
            <label className={labelClass}>Existing NIC/Govt. Email ID</label>
            <input
              type="email"
              value={form.existingNicEmail}
              onChange={(e) => update("existingNicEmail", e.target.value)}
              placeholder="existing@nic.in"
              className={inputClass}
            />
          </div>
        )}
      </div>

      {/* Section 3: Replacement Fields */}
      {form.requestType === "REPLACE" && (
        <div className={sectionClass}>
          <h2 className="text-base font-semibold text-orange-600 border-b pb-2">
            Section 3 — Replacement Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Old GeM ID</label>
              <input
                type="text"
                value={form.oldGemId}
                onChange={(e) => update("oldGemId", e.target.value)}
                placeholder="Previous GeM User ID"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Name of Previous User</label>
              <input
                type="text"
                value={form.lastUserName}
                onChange={(e) => update("lastUserName", e.target.value)}
                placeholder="Name of the last user"
                className={inputClass}
              />
            </div>
          </div>
        </div>
      )}

      {/* Section 4: Project Details */}
      <div className={sectionClass}>
        <h2 className="text-base font-semibold text-amu-green border-b pb-2">
          Section 4 — Project Details <span className="text-gray-400 font-normal text-xs">(Optional)</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Name of Project</label>
            <input
              type="text"
              value={form.projectName}
              onChange={(e) => update("projectName", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Funded By</label>
            <input
              type="text"
              value={form.fundedBy}
              onChange={(e) => update("fundedBy", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Project Code</label>
            <input
              type="text"
              value={form.projectCode}
              onChange={(e) => update("projectCode", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Section 5: HOD Details & Undertaking */}
      <div className={sectionClass}>
        <h2 className="text-base font-semibold text-amu-green border-b pb-2">
          Section 5 — HoD Details & Undertaking
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>HoD Name</label>
            <input
              type="text"
              value={form.hodName}
              onChange={(e) => update("hodName", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>HoD Designation</label>
            <input
              type="text"
              value={form.hodDesignation}
              onChange={(e) => update("hodDesignation", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Extension / Phone</label>
            <input
              type="text"
              value={form.hodPhone}
              onChange={(e) => update("hodPhone", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* Undertaking */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-2">
          <p className="text-sm font-semibold text-amber-800 mb-2">Undertaking</p>
          <pre className="text-xs text-amber-700 whitespace-pre-wrap font-sans leading-relaxed">
            {UNDERTAKING_TEXT}
          </pre>
        </div>
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative mt-0.5">
            <input
              type="checkbox"
              checked={undertakingAccepted}
              onChange={(e) => setUndertakingAccepted(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                undertakingAccepted
                  ? "bg-amu-green border-amu-green"
                  : "border-gray-300 group-hover:border-amu-green/50"
              }`}
            >
              {undertakingAccepted && <CheckSquare size={12} className="text-white" />}
            </div>
          </div>
          <span className="text-sm text-gray-700">
            I/We agree to the above undertaking and certify that all information provided is correct.
          </span>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={() => handleSubmit("DRAFT")}
          disabled={submitting}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium text-sm transition-all disabled:opacity-50"
        >
          <Save size={16} />
          Save as Draft
        </button>
        <button
          type="button"
          onClick={() => handleSubmit("SUBMITTED")}
          disabled={submitting || !undertakingAccepted}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amu-green text-white font-medium text-sm hover:bg-amu-green-mid transition-all disabled:opacity-50 shadow-md"
        >
          <Send size={16} />
          {submitting ? "Submitting..." : "Submit Request"}
        </button>
      </div>
    </div>
  );
}
