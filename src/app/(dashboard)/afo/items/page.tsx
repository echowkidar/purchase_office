"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";

interface Item {
  id: string;
  name: string;
  itemCode?: string;
  isActive: boolean;
  category: { name: string; slug: string };
  variants: { id: string; label: string }[];
  mainImage?: string;
}

export default function AFOItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = () => {
    fetch("/api/items?active=false")
      .then((res) => res.json())
      .then((data) => {
        setItems(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
      const data = await res.json();
      
      if (res.ok) {
        alert(data.message);
        fetchItems();
      } else {
        alert(data.error || "Failed to delete item");
      }
    } catch (error) {
      alert("An error occurred while deleting the item.");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-amu-green">Manage Items</h1>
          <p className="text-sm text-gray-400">Add, edit, or remove items from the catalogue</p>
        </div>
        <Link
          href="/afo/items/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amu-gold text-amu-green font-semibold hover:bg-amu-gold-light transition-all shadow-sm"
        >
          <Plus size={16} /> Add Item
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Package size={40} className="mx-auto mb-2 opacity-30" />
            <p>No items in catalogue</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 text-gray-500 font-medium">Item</th>
                  <th className="text-left p-3 text-gray-500 font-medium">Code</th>
                  <th className="text-left p-3 text-gray-500 font-medium">Category</th>
                  <th className="text-center p-3 text-gray-500 font-medium">Variants</th>
                  <th className="text-center p-3 text-gray-500 font-medium">Status</th>
                  <th className="text-center p-3 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3 font-medium text-amu-green">{item.name}</td>
                    <td className="p-3 font-mono text-xs text-gray-400">{item.itemCode || "—"}</td>
                    <td className="p-3">{item.category.name}</td>
                    <td className="p-3 text-center">{item.variants.length}</td>
                    <td className="p-3 text-center">
                      {item.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-600 text-xs">
                          <Eye size={12} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs">
                          <EyeOff size={12} /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/afo/items/${item.id}/edit`}
                          className="p-1.5 rounded-lg hover:bg-amu-green/10 text-amu-green"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
