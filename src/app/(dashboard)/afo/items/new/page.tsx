"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, X, Save, Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function NewItemPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    specifications: "",
    itemCode: "",
    categoryId: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(imageFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  const [variants, setVariants] = useState<
    { label: string; imageFile?: File | null; previewUrl?: string | null }[]
  >([{ label: "" }]);

  useEffect(() => {
    fetch("/api/items/categories")
      .then((res) => res.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const finalVariants = [];
    for (const v of variants) {
      if (!v.label.trim()) continue;
      
      let imgUrl = undefined;
      if (v.imageFile) {
        const formData = new FormData();
        formData.append("file", v.imageFile);
        try {
          const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
          if (uploadRes.ok) {
            const data = await uploadRes.json();
            imgUrl = data.url;
          }
        } catch (e) {}
      }
      
      finalVariants.push({
        label: v.label,
        image: imgUrl
      });
    }

    let mainImage = form.itemCode ? undefined : undefined; // just dummy
    if (imageFile) {
      const formData = new FormData();
      formData.append("file", imageFile);
      try {
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          mainImage = uploadData.url;
        }
      } catch (err) {}
    }

    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        mainImage,
        variants: finalVariants.length > 0 ? finalVariants : undefined,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to create item");
      setLoading(false);
      return;
    }

    router.push("/afo/items");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/afo/items" className="text-gray-400 hover:text-amu-green">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-amu-green">Add New Item</h1>
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
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <label
                  htmlFor="item-image"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 cursor-pointer transition-colors text-sm whitespace-nowrap"
                >
                  <Upload size={16} /> Choose Image
                </label>
                <input
                  type="file"
                  id="item-image"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                />
                {imageFile && (
                  <button
                    type="button"
                    onClick={() => setImageFile(null)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition-colors text-sm whitespace-nowrap"
                  >
                    <X size={16} /> Remove
                  </button>
                )}
              </div>
              
              {previewUrl && (
                <div className="relative w-32 h-32 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 flex-shrink-0 shadow-sm">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-contain p-1.5" />
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
          <div className="space-y-3">
            {variants.map((v, i) => (
              <div key={i} className="flex flex-col gap-2 p-3 border border-gray-100 rounded-lg bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={v.label}
                    onChange={(e) => {
                      const updated = [...variants];
                      updated[i] = { ...v, label: e.target.value };
                      setVariants(updated);
                    }}
                    placeholder={`Variant ${i + 1} (e.g. 8GB RAM, Red)`}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-amu-green/30"
                  />
                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setVariants(variants.filter((_, idx) => idx !== i))}
                      className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                
                <div className="flex items-center gap-3 mt-1">
                  <label
                    htmlFor={`variant-image-${i}`}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors text-xs"
                  >
                    <ImageIcon size={14} /> {v.imageFile ? "Change Variant Image" : "Add Specific Image (Optional)"}
                  </label>
                  <input
                    type="file"
                    id={`variant-image-${i}`}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      const updated = [...variants];
                      if (file) {
                        updated[i].imageFile = file;
                        updated[i].previewUrl = URL.createObjectURL(file);
                      } else {
                        updated[i].imageFile = null;
                        updated[i].previewUrl = null;
                      }
                      setVariants(updated);
                    }}
                  />
                  {v.previewUrl && (
                    <div className="flex items-center gap-2">
                       <div className="relative w-8 h-8 rounded border border-gray-200 overflow-hidden bg-white">
                          <img src={v.previewUrl} alt="Variant" className="w-full h-full object-contain" />
                       </div>
                       <button
                         type="button"
                         onClick={() => {
                            const updated = [...variants];
                            updated[i].imageFile = null;
                            updated[i].previewUrl = null;
                            setVariants(updated);
                         }}
                         className="text-xs text-red-500 hover:text-red-700 font-medium"
                       >
                         Remove
                       </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-amu-green text-white font-semibold hover:bg-amu-green-mid disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          <Save size={16} /> {loading ? "Creating..." : "Create Item"}
        </button>
      </form>
    </div>
  );
}
