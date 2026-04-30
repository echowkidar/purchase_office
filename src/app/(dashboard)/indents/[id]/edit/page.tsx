"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  Loader2,
  Save,
  Plus,
  Minus,
  Trash2,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";

interface IndentItem {
  id: string;
  itemId: string;
  quantity: number;
  variantId?: string;
  year1Label?: string;
  year1Qty?: number;
  year1Remarks?: string;
  year2Label?: string;
  year2Qty?: number;
  year2Remarks?: string;
  year3Label?: string;
  year3Qty?: number;
  year3Remarks?: string;
  remarks?: string;
  usedByName?: string;
  item: {
    name: string;
    category: { name: string };
    variants: { id: string; label: string }[];
  };
}

interface IndentDetail {
  id: string;
  requisitionNo: string;
  purpose: string;
  urgency: string;
  status: string;
  requestedById: string;
  department: { id: string; name: string };
  items: IndentItem[];
}

export default function EditIndentPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [indent, setIndent] = useState<IndentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [purpose, setPurpose] = useState("");
  const [urgency, setUrgency] = useState<"NORMAL" | "URGENT">("NORMAL");
  const [items, setItems] = useState<IndentItem[]>([]);

  // Add Item Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [itemSearch, setItemSearch] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [newItemQty, setNewItemQty] = useState(1);
  const [addingItem, setAddingItem] = useState(false);

  useEffect(() => {
    fetch(`/api/indents/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setIndent(data);
        setPurpose(data.purpose || "");
        setUrgency(data.urgency || "NORMAL");
        setItems(data.items || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const role = session?.user?.role;
  const userId = session?.user?.id;

  // Permission check
  const canEdit =
    indent &&
    ((role === "DEPT_USER" && indent.status === "DRAFT") ||
      ((role === "AFO_STAFF" || role === "SUPER_ADMIN") &&
        (indent.status === "CPO_RECEIVED" || indent.status === "DRAFT" || indent.status === "SUBMITTED")));

  const updateItemField = (itemId: string, field: string, value: string | number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
  };

  const removeItem = (itemId: string) => {
    if (items.length <= 1) {
      alert("Indent must have at least one item.");
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const openAddModal = () => {
    setShowAddModal(true);
    setAddingItem(true);
    fetch("/api/items?active=true")
      .then((res) => res.json())
      .then((data) => {
        setAvailableItems(Array.isArray(data) ? data : []);
        setAddingItem(false);
      })
      .catch(() => setAddingItem(false));
  };

  const handleAddNewItem = () => {
    if (!selectedItemId) return;
    const itemDef = availableItems.find(i => i.id === selectedItemId);
    if (!itemDef) return;

    const newItem: IndentItem = {
      id: "new-" + Date.now(), // temporary ID
      itemId: selectedItemId,
      quantity: newItemQty,
      variantId: selectedVariantId || undefined,
      year1Label: "2023-24", // Defaults
      year1Qty: 0,
      year2Label: "2024-25",
      year2Qty: 0,
      year3Label: "2025-26",
      year3Qty: 0,
      remarks: "",
      usedByName: "",
      item: {
        name: itemDef.name,
        category: { name: itemDef.category?.name || "Unknown" },
        variants: itemDef.variants || [],
      }
    };

    setItems([...items, newItem]);
    setShowAddModal(false);
    setSelectedItemId("");
    setSelectedVariantId("");
    setNewItemQty(1);
    setItemSearch("");
  };

  const handleSave = async () => {
    if (purpose.length < 10) {
      setError("Purpose must be at least 10 characters.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/indents/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose,
          urgency,
          items: items.map((item) => ({
            id: item.id,
            itemId: item.itemId,
            variantId: item.variantId,
            quantity: item.quantity,
            year1Label: item.year1Label,
            year1Qty: item.year1Qty || 0,
            year1Remarks: item.year1Remarks || "",
            year2Label: item.year2Label,
            year2Qty: item.year2Qty || 0,
            year2Remarks: item.year2Remarks || "",
            year3Label: item.year3Label,
            year3Qty: item.year3Qty || 0,
            year3Remarks: item.year3Remarks || "",
            remarks: item.remarks || "",
            usedByName: item.usedByName || "",
          })),
        }),
      });

      if (res.ok) {
        router.push(`/indents/${id}`);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save changes");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading...
      </div>
    );
  }

  if (!indent || !canEdit) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400">
          {!indent ? "Indent not found" : "You do not have permission to edit this indent."}
        </p>
        <Link href="/indents" className="text-amu-gold mt-2 inline-block text-sm">
          ← Back to Indents
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href={`/indents/${indent.id}`}
          className="flex items-center gap-2 text-gray-400 hover:text-amu-green transition-colors text-sm"
        >
          <ArrowLeft size={16} /> Back to Indent
        </Link>
        <h1 className="text-xl font-bold text-amu-green font-mono">
          Edit: {indent.requisitionNo}
        </h1>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        <h2 className="text-lg font-semibold text-amu-green">Basic Information</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <input
              type="text"
              value={indent.department.name}
              readOnly
              className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
            <div className="flex gap-3">
              <button
                onClick={() => setUrgency("NORMAL")}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                  urgency === "NORMAL"
                    ? "border-amu-green bg-amu-green/5 text-amu-green"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                Normal
              </button>
              <button
                onClick={() => setUrgency("URGENT")}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                  urgency === "URGENT"
                    ? "border-red-400 bg-red-50 text-red-600"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                Urgent
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Purpose / Justification *
          </label>
          <textarea
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amu-green/20 focus:border-amu-green text-sm"
          />
          <p className="text-xs text-gray-400 mt-1">
            Minimum 10 characters. {purpose.length}/10
          </p>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-amu-green">
            Items ({items.length})
          </h2>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amu-gold text-amu-green font-semibold text-sm hover:bg-amu-gold-light transition-all"
          >
            <Plus size={14} /> Add Item
          </button>
        </div>

        {items.map((item, idx) => {
          const variant = item.item.variants.find((v) => v.id === item.variantId);
          return (
            <div
              key={item.id}
              className="border border-gray-100 rounded-xl p-4 space-y-3 bg-gray-50/50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-400 mr-2">{idx + 1}.</span>
                  <span className="font-medium text-amu-green">{item.item.name}</span>
                  {variant && (
                    <span className="text-gray-400 text-sm ml-2">— {variant.label}</span>
                  )}
                  <span className="text-gray-400 text-xs ml-2">({item.item.category.name})</span>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Remove Item"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Quantity</label>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        updateItemField(item.id, "quantity", Math.max(1, item.quantity - 1))
                      }
                      className="p-1 rounded border border-gray-200 hover:bg-gray-100"
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        updateItemField(item.id, "quantity", Math.max(1, parseInt(e.target.value) || 1))
                      }
                      className="w-16 text-center px-2 py-1 rounded border border-gray-200 text-sm"
                    />
                    <button
                      onClick={() => updateItemField(item.id, "quantity", item.quantity + 1)}
                      className="p-1 rounded border border-gray-200 hover:bg-gray-100"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    {item.year1Label || "Year 1"} Qty
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={item.year1Qty ?? 0}
                    onChange={(e) =>
                      updateItemField(item.id, "year1Qty", parseInt(e.target.value) || 0)
                    }
                    className="w-full px-2 py-1 rounded border border-gray-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    {item.year2Label || "Year 2"} Qty
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={item.year2Qty ?? 0}
                    onChange={(e) =>
                      updateItemField(item.id, "year2Qty", parseInt(e.target.value) || 0)
                    }
                    className="w-full px-2 py-1 rounded border border-gray-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    {item.year3Label || "Year 3"} Qty
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={item.year3Qty ?? 0}
                    onChange={(e) =>
                      updateItemField(item.id, "year3Qty", parseInt(e.target.value) || 0)
                    }
                    className="w-full px-2 py-1 rounded border border-gray-200 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Remarks</label>
                  <input
                    type="text"
                    value={item.remarks || ""}
                    onChange={(e) => updateItemField(item.id, "remarks", e.target.value)}
                    placeholder="Optional remarks..."
                    className="w-full px-3 py-1.5 rounded border border-gray-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Used By</label>
                  <input
                    type="text"
                    value={item.usedByName || ""}
                    onChange={(e) => updateItemField(item.id, "usedByName", e.target.value)}
                    placeholder="Person who will use this item..."
                    className="w-full px-3 py-1.5 rounded border border-gray-200 text-sm"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between">
        <Link
          href={`/indents/${indent.id}`}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm transition-all"
        >
          <ArrowLeft size={16} /> Cancel
        </Link>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-8 py-3 rounded-lg font-bold transition-all shadow-md ${
            saving
              ? "bg-gray-400 text-white cursor-not-allowed opacity-70"
              : "bg-amu-green text-white hover:bg-amu-green-mid hover:shadow-lg transform hover:-translate-y-0.5"
          }`}
        >
          {saving ? (
            <><Loader2 size={16} className="animate-spin" /> Saving...</>
          ) : (
            <><Save size={16} /> Save Changes</>
          )}
        </button>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-bold text-amu-green">Add Item from Catalogue</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search catalogue..."
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amu-green/20"
                />
              </div>

              {addingItem ? (
                <div className="text-center py-8 text-gray-400"><Loader2 className="animate-spin mx-auto" /></div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {availableItems
                    .filter(i => i.name.toLowerCase().includes(itemSearch.toLowerCase()) || i.itemCode?.toLowerCase().includes(itemSearch.toLowerCase()))
                    .map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedItemId(item.id);
                          setSelectedVariantId("");
                        }}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedItemId === item.id
                            ? "border-amu-green bg-amu-green/5"
                            : "border-gray-200 hover:border-amu-green/30 hover:bg-gray-50"
                        }`}
                      >
                        <div className="font-medium text-amu-green">{item.name}</div>
                        <div className="text-xs text-gray-400">
                          {item.category?.name} {item.itemCode && `• ${item.itemCode}`}
                        </div>
                      </div>
                  ))}
                </div>
              )}

              {selectedItemId && (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 mt-4 space-y-4">
                  {availableItems.find(i => i.id === selectedItemId)?.variants?.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Select Variant</label>
                      <select
                        value={selectedVariantId}
                        onChange={(e) => setSelectedVariantId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200"
                        required
                      >
                        <option value="">Select Variant...</option>
                        {availableItems.find(i => i.id === selectedItemId)?.variants.map((v: any) => (
                          <option key={v.id} value={v.id}>{v.label}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      min={1}
                      value={newItemQty}
                      onChange={(e) => setNewItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNewItem}
                disabled={!selectedItemId || (availableItems.find(i => i.id === selectedItemId)?.variants?.length > 0 && !selectedVariantId)}
                className="px-6 py-2 rounded-lg bg-amu-green text-white font-medium hover:bg-amu-green-mid disabled:opacity-50"
              >
                Add to Indent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
