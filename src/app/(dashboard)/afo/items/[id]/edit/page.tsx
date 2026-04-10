"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Plus, X, Save, Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function EditItemPage() {
  const router = useRouter();
  const { id } = useParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    specifications: "",
    itemCode: "",
    categoryId: "",
    mainImage: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);

  const [variants, setVariants] = useState<
    { label: string; acType?: string; tonCapacity?: string; starRating?: string }[]
  >([]);

  useEffect(() => {
    fetch("/api/items/categories")
      .then((res) => res.json())
      .then(setCategories)
      .catch(() => {});

    fetch(`/api/items/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setForm({
          name: data.name || "",
          description: data.description || "",
          specifications: data.specifications || "",
          itemCode: data.itemCode || "",
          categoryId: data.categoryId || "",
          mainImage: data.mainImage || "",
        });
        if (data.variants && data.variants.length > 0) {
          setVariants(data.variants.map((v: any) => ({ label: v.label, acType: v.acType, tonCapacity: v.tonCapacity, starRating: v.starRating })));
        } else {
          setVariants([{ label: "" }]);
        }
        setFetching(false);
      })
      .catch(() => {
        setError("Failed to fetch item data");
        setFetching(false);
      });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const validVariants = variants.filter((v) => v.label.trim());

    let finalImageUrl = form.mainImage;
    if (imageFile) {
      const formData = new FormData();
      formData.append("file", imageFile);
      try {
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          finalImageUrl = uploadData.url;
        }
      } catch (err) {}
    }

    const { mainImage, ...rest } = form; // replace mainImage dynamically

    const res = await fetch(`/api/items/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...rest,
        mainImage: finalImageUrl,
        variants: validVariants.length > 0 ? validVariants : undefined,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to update item");
      setLoading(false);
      return;
    }

    router.push("/afo/items");
  };

  if (fetching) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/afo/items" className="text-gray-400 hover:text-amu-green">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-amu-green">Edit Item</h1>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amu-green/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
          <select
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            required
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amu-green/20"
          >
            <option value="">Select Category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Code</label>
            <input
              type="text"
              value={form.itemCode}
              onChange={(e) => setForm({ ...form, itemCode: e.target.value })}
              placeholder="e.g. EQ-LAP-001"
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amu-green/20 font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Image</label>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <label
                  htmlFor="item-image"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 cursor-pointer transition-colors text-sm whitespace-nowrap"
                >
                  <Upload size={16} /> {form.mainImage ? "Replace Image" : "Upload Image"}
                </label>
                <input
                  type="file"
                  id="item-image"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                />

                {(imageFile || form.mainImage) && (
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setForm({ ...form, mainImage: "" });
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition-colors text-sm whitespace-nowrap"
                  >
                    <X size={16} /> Remove
                  </button>
                )}

                {(imageFile || form.mainImage) && (
                  <span className="text-sm text-amu-green font-medium flex items-center gap-1 truncate max-w-[120px]">
                    <ImageIcon size={14} className="flex-shrink-0" />
                    <span className="truncate">
                      {imageFile ? imageFile.name : "Current Image"}
                    </span>
                  </span>
                )}
              </div>
              
              {!imageFile && form.mainImage && (
                <div className="relative w-16 h-16 rounded-md border border-gray-200 overflow-hidden bg-gray-50 flex-shrink-0">
                  <img src={form.mainImage} alt="Preview" className="w-full h-full object-contain p-1" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amu-green/20 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Specifications</label>
          <textarea
            value={form.specifications}
            onChange={(e) => setForm({ ...form, specifications: e.target.value })}
            rows={2}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amu-green/20 text-sm"
          />
        </div>

        {/* Variants */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Variants</label>
            <button
              type="button"
              onClick={() => setVariants([...variants, { label: "" }])}
              className="text-xs text-amu-gold hover:text-amu-gold-light flex items-center gap-1"
            >
              <Plus size={14} /> Add Variant
            </button>
          </div>
          <div className="space-y-2">
            {variants.map((v, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={v.label}
                  onChange={(e) => {
                    const updated = [...variants];
                    updated[i] = { ...v, label: e.target.value };
                    setVariants(updated);
                  }}
                  placeholder={`Variant ${i + 1} (e.g. 8GB RAM, Revolving)`}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-amu-green/30"
                />
                <button
                  type="button"
                  onClick={() => setVariants(variants.filter((_, idx) => idx !== i))}
                  className="p-1 text-red-400 hover:text-red-600"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-amu-green text-white font-semibold hover:bg-amu-green-mid disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {loading ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Changes</>}
        </button>
      </form>
    </div>
  );
}
