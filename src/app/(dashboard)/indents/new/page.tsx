"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { useSession } from "next-auth/react";
import {
  ClipboardList,
  ShoppingCart,
  History,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Plus,
} from "lucide-react";

const STEPS = [
  { label: "Basic Info", icon: ClipboardList },
  { label: "Select Items", icon: ShoppingCart },
  { label: "3-Year History", icon: History },
  { label: "Review & Submit", icon: CheckCircle },
];

const currentYear = new Date().getFullYear();
const YEAR_LABELS = [
  `${currentYear - 3}-${String(currentYear - 2).slice(2)}`,
  `${currentYear - 2}-${String(currentYear - 1).slice(2)}`,
  `${currentYear - 1}-${String(currentYear).slice(2)}`,
];

export default function NewIndentPage() {
  return (
    <Suspense fallback={<div className="text-center py-10">Loading...</div>}>
      <NewIndentContent />
    </Suspense>
  );
}

function NewIndentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const cart = useCartStore();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [isIndentEnabled, setIsIndentEnabled] = useState(true);

  // Step 1 data — restored from localStorage if user returns from catalogue
  const [purpose, setPurpose] = useState("");
  const [urgency, setUrgency] = useState<"NORMAL" | "URGENT">("NORMAL");
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [departments, setDepartments] = useState<{id: string; name: string; code: string}[]>([]);

  const role = session?.user?.role;
  const isCPO = role === "AFO_STAFF" || role === "SUPER_ADMIN";

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.ENABLE_INDENT_CREATION) {
          setIsIndentEnabled(data.ENABLE_INDENT_CREATION === "true");
        }
      })
      .catch((err) => console.error("Failed to load settings:", err));
  }, []);

  // Restore saved basic info and auto-skip to items step if coming back from cart
  useEffect(() => {
    let savedPurpose = "";
    try {
      const saved = localStorage.getItem("cpo-indent-basicinfo");
      if (saved) {
        const data = JSON.parse(saved);
        if (data.purpose) {
          setPurpose(data.purpose);
          savedPurpose = data.purpose;
        }
        if (data.urgency) setUrgency(data.urgency);
      }
    } catch {}
    // If coming from cart sidebar, check if purpose was already filled
    const fromCart = searchParams.get("step");
    if (fromCart === "items" && cart.items.length > 0) {
      if (savedPurpose.length >= 10) {
        // Purpose already filled — skip to items step
        setStep(1);
      } else {
        // Purpose not filled — stay on basic info so user fills it first
        setStep(0);
      }
    }
    setInitialized(true);
  }, []);

  // Fetch departments for CPO/Admin users
  useEffect(() => {
    if (isCPO) {
      fetch("/api/departments")
        .then((r) => r.json())
        .then((data) => setDepartments(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [isCPO]);

  // Save basic info whenever it changes so it survives catalogue navigation
  useEffect(() => {
    if (!initialized) return;
    localStorage.setItem("cpo-indent-basicinfo", JSON.stringify({ purpose, urgency }));
  }, [purpose, urgency, initialized]);

  // Redirect if cart is empty (on step > 0)
  useEffect(() => {
    if (step > 1 && cart.items.length === 0) {
      setStep(1);
    }
  }, [step, cart.items.length]);

  const canProceed = () => {
    if (step === 0) {
      if (purpose.length < 10) return false;
      if (isCPO && !selectedDeptId) return false;
      return true;
    }
    if (step === 1) {
      if (cart.items.length === 0) return false;
      // All items must have a usedByName filled
      return cart.items.every(item => item.usedByName && item.usedByName.trim().length > 0);
    }
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/indents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose,
          urgency,
          ...(isCPO && selectedDeptId ? { departmentId: selectedDeptId } : {}),
          items: cart.items.map((item) => ({
            itemId: item.itemId,
            variantId: item.variantId,
            variantLabel: item.variantLabel,
            quantity: item.quantity,
            year1Label: item.year1Label || YEAR_LABELS[0],
            year1Qty: item.year1Qty || 0,
            year1Remarks: item.year1Remarks || "",
            year2Label: item.year2Label || YEAR_LABELS[1],
            year2Qty: item.year2Qty || 0,
            year2Remarks: item.year2Remarks || "",
            year3Label: item.year3Label || YEAR_LABELS[2],
            year3Qty: item.year3Qty || 0,
            year3Remarks: item.year3Remarks || "",
            remarks: item.remarks || "",
            usedByName: item.usedByName || "",
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to submit indent");
        return;
      }

      cart.clearCart();
      localStorage.removeItem("cpo-indent-basicinfo");
      router.push(`/indents/${data.id}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isIndentEnabled && role === "DEPT_USER") {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <CheckCircle size={32} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Indent Creation Disabled</h2>
        <p className="text-gray-500">
          The facility to create new indents is currently disabled by the administration.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Stepper */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="flex items-center flex-1">
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                    i === step
                      ? "bg-amu-green text-white"
                      : i < step
                      ? "bg-status-received/10 text-status-received"
                      : "bg-gray-50 text-gray-400"
                  }`}
                >
                  <Icon size={16} />
                  <span className="text-sm font-medium hidden sm:inline">
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 rounded ${
                      i < step ? "bg-status-received" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* STEP 1: Basic Info */}
        {step === 0 && (
          <div className="space-y-5 animate-fade-in">
            <h2 className="text-xl font-bold text-amu-green">Basic Information</h2>
            <p className="text-sm text-gray-500 mb-2">First, provide the purpose and urgency for this indent before reviewing items.</p>

            <div className="grid grid-cols-2 gap-4">
              {isCPO ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department (on behalf of) *
                  </label>
                  <select
                    value={selectedDeptId}
                    onChange={(e) => setSelectedDeptId(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amu-green/20 focus:border-amu-green text-sm"
                  >
                    <option value="">Select Department...</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={session?.user?.departmentName || ""}
                    readOnly
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-600"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="text"
                  value={new Date().toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  readOnly
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purpose / Justification *
              </label>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={4}
                placeholder="Explain why these items are needed (e.g., For the Computer Lab upgrade to support 60 students)..."
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amu-green/20 focus:border-amu-green text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">
                Minimum 10 characters. {purpose.length}/10
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Urgency Level
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setUrgency("NORMAL")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                    urgency === "NORMAL"
                      ? "border-amu-green bg-amu-green/5 text-amu-green"
                      : "border-gray-200 text-gray-500"
                  }`}
                >
                  Normal
                </button>
                <button
                  onClick={() => setUrgency("URGENT")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                    urgency === "URGENT"
                      ? "border-red-500 bg-red-50 text-red-600"
                      : "border-gray-200 text-gray-500"
                  }`}
                >
                  🔴 Urgent
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Items from Cart */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-amu-green">Selected Items</h2>
              <a
                href="/catalogue"
                className="text-sm text-amu-gold hover:text-amu-gold-light"
              >
                + Browse Catalogue
              </a>
            </div>

            {cart.items.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <ShoppingCart size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 mb-4 font-medium text-lg">Your cart is empty.</p>
                <a
                  href="/catalogue"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-amu-gold text-amu-green font-bold hover:bg-amu-gold-light transition-all shadow-md"
                >
                  <Plus size={20} /> Add Items from Catalogue
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.items.map((item, idx) => (
                  <div key={item.id} className="p-3 border border-gray-100 rounded-xl bg-gray-50/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-gray-400 mr-2">{idx + 1}.</span>
                        <span className="font-medium text-amu-green">{item.itemName}</span>
                        {item.variantLabel && (
                          <span className="text-gray-400 text-sm"> — {item.variantLabel}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">Qty: {item.quantity}</span>
                        <button
                          onClick={() => cart.removeItem(item.id)}
                          className="text-red-400 hover:text-red-600 text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="Name of person who will use this item *"
                        value={item.usedByName || ""}
                        required
                        onChange={(e) =>
                          cart.updateHistory(item.id, { usedByName: e.target.value })
                        }
                        className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-amu-green/30 bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: 3-Year History */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-bold text-amu-green">
              Previous 3 Years Purchase History
            </h2>
            <p className="text-sm text-gray-400">
              For each item, enter the quantities purchased in the last 3 years.
              Write &quot;0&quot; or leave blank if not applicable.
            </p>

            {cart.items.map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-xl p-4"
              >
                <h3 className="font-semibold text-amu-green mb-3">
                  {item.itemName}
                  {item.variantLabel && (
                    <span className="text-gray-400 font-normal">
                      {" "} — {item.variantLabel}
                    </span>
                  )}
                  <span className="text-gray-400 font-normal"> (Qty: {item.quantity})</span>
                </h3>

                <div className="grid grid-cols-3 gap-4">
                  {YEAR_LABELS.map((label, yi) => (
                    <div key={yi}>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        {label}
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="Qty"
                        value={
                          yi === 0
                            ? item.year1Qty ?? ""
                            : yi === 1
                            ? item.year2Qty ?? ""
                            : item.year3Qty ?? ""
                        }
                        onChange={(e) => {
                          const val = e.target.value ? parseInt(e.target.value) : undefined;
                          const key =
                            yi === 0
                              ? "year1Qty"
                              : yi === 1
                              ? "year2Qty"
                              : "year3Qty";
                          const labelKey =
                            yi === 0
                              ? "year1Label"
                              : yi === 1
                              ? "year2Label"
                              : "year3Label";
                          cart.updateHistory(item.id, {
                            [key]: val,
                            [labelKey]: label,
                          });
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-amu-green/30"
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Remarks (optional)"
                    value={item.remarks || ""}
                    onChange={(e) =>
                      cart.updateHistory(item.id, { remarks: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-amu-green/30"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* STEP 4: Review & Submit */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-in">
            <h2 className="text-xl font-bold text-amu-green">Review & Submit</h2>

            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Department:</span>
                <span className="font-medium">{session?.user?.departmentName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Urgency:</span>
                <span className={urgency === "URGENT" ? "text-red-600 font-bold" : ""}>
                  {urgency}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Purpose:</span>
                <p className="mt-1 text-gray-700">{purpose}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-gray-500 font-medium">S.No</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Item</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Variant</th>
                    <th className="text-center py-2 text-gray-500 font-medium">Qty</th>
                    {YEAR_LABELS.map((y) => (
                      <th key={y} className="text-center py-2 text-gray-500 font-medium">
                        {y}
                      </th>
                    ))}
                    <th className="text-left py-2 text-gray-500 font-medium">Remarks</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Used By</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.items.map((item, idx) => (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="py-2">{idx + 1}</td>
                      <td className="py-2 font-medium text-amu-green">
                        {item.itemName}
                      </td>
                      <td className="py-2 text-gray-500">
                        {item.variantLabel || "—"}
                      </td>
                      <td className="py-2 text-center font-mono">
                        {item.quantity}
                      </td>
                      <td className="py-2 text-center font-mono">
                        {item.year1Qty ?? 0}
                      </td>
                      <td className="py-2 text-center font-mono">
                        {item.year2Qty ?? 0}
                      </td>
                      <td className="py-2 text-center font-mono">
                        {item.year3Qty ?? 0}
                      </td>
                      <td className="py-2 text-gray-500 text-xs">
                        {item.remarks || "—"}
                      </td>
                      <td className="py-2 text-gray-500 text-xs">
                        {item.usedByName || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ArrowLeft size={16} /> Back
        </button>

        {step < 3 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-amu-green text-white font-medium hover:bg-amu-green-mid disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Next <ArrowRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting || cart.items.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-amu-gold text-amu-green font-bold hover:bg-amu-gold-light disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Submitting...
              </>
            ) : (
              <>
                <CheckCircle size={16} /> Submit Indent
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
