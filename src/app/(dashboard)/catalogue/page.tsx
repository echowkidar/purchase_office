"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, ShoppingCart, Plus, Minus, Package, X, Eye, Edit } from "lucide-react";
import { useCartStore, CartItem } from "@/store/cartStore";
import { useSession } from "next-auth/react";

interface ItemVariant {
  id: string;
  label: string;
  image?: string;
  acType?: string;
  tonCapacity?: string;
  starRating?: string;
}

interface Item {
  id: string;
  name: string;
  description: string;
  specifications: string;
  itemCode: string;
  mainImage?: string;
  category: { id: string; name: string; slug: string };
  variants: ItemVariant[];
}

const CATEGORIES = [
  { slug: "", label: "All Items" },
  { slug: "equipment", label: "Equipment" },
  { slug: "furniture", label: "Furniture" },
  { slug: "ac", label: "Air Conditioner" },
];

export default function CataloguePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showCart, setShowCart] = useState(false);

  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "AFO_STAFF" || session?.user?.role === "SUPER_ADMIN";

  const cart = useCartStore();

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (search) params.set("search", search);

    fetch(`/api/items?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setItems(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [category, search]);

  const handleAddToCart = (
    item: Item,
    variant: ItemVariant | null,
    qty: number
  ) => {
    const cartItem: Omit<CartItem, "id"> = {
      itemId: item.id,
      itemName: item.name,
      itemImage: variant?.image || item.mainImage,
      categoryName: item.category.name,
      variantId: variant?.id,
      variantLabel: variant?.label,
      quantity: qty,
    };
    cart.addItem(cartItem);
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-amu-green">Item Catalogue</h1>
          <p className="text-sm text-gray-400">
            Browse and add items to your indent cart
          </p>
        </div>
        <button
          onClick={() => setShowCart(true)}
          className="relative inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amu-gold text-amu-green font-semibold hover:bg-amu-gold-light transition-all shadow-sm"
        >
          <ShoppingCart size={18} />
          Cart
          {cart.items.length > 0 && (
            <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
              {cart.items.length}
            </span>
          )}
        </button>
      </div>

      {/* Search & Category Tabs */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amu-green/20 focus:border-amu-green transition-all bg-white"
          />
        </div>
        <div className="flex gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setCategory(cat.slug)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                category === cat.slug
                  ? "bg-amu-green text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-amu-green/30"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-pulse"
            >
              <div className="w-full h-40 bg-gray-200 rounded-lg mb-4" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl">
          <Package size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400">No items found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onView={() => setSelectedItem(item)}
              onAddToCart={handleAddToCart}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}

      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* Cart Sidebar */}
      {showCart && <CartSidebar onClose={() => setShowCart(false)} />}
    </>
  );
}

// ──────────────────── ITEM CARD ────────────────────

function ItemCard({
  item,
  onView,
  onAddToCart,
  isAdmin,
}: {
  item: Item;
  onView: () => void;
  onAddToCart: (item: Item, variant: ItemVariant | null, qty: number) => void;
  isAdmin?: boolean;
}) {
  const [selectedVariant, setSelectedVariant] = useState<string>(
    item.variants[0]?.id || ""
  );
  const [qty, setQty] = useState(1);

  const variant = item.variants.find((v) => v.id === selectedVariant) || null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group">
      {/* Image */}
      <div
        className="relative h-56 bg-white flex items-center justify-center cursor-pointer p-2 border-b border-gray-50"
        onClick={onView}
      >
        {variant?.image || item.mainImage ? (
          <img
            src={variant?.image || item.mainImage}
            alt={item.name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform"
          />
        ) : (
          <Package size={48} className="text-gray-300" />
        )}
        <div className="absolute top-2 right-2 z-10">
          <span className="px-2 py-0.5 rounded-full bg-white/90 text-amu-green text-[10px] font-medium shadow-[0_2px_4px_rgba(0,0,0,0.05)] backdrop-blur-sm border border-gray-100">
            {item.category.name}
          </span>
        </div>
        {isAdmin && (
          <Link
            href={`/afo/items/${item.id}/edit`}
            className="absolute top-2 left-2 z-10 p-1.5 rounded-full bg-white/90 shadow-[0_2px_4px_rgba(0,0,0,0.05)] border border-gray-100 hover:bg-white text-amu-gold transition-all"
            onClick={(e) => e.stopPropagation()}
            title="Edit Item"
          >
            <Edit size={14} />
          </Link>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
          className="absolute bottom-2 right-2 z-10 p-1.5 rounded-full bg-white/90 shadow-[0_2px_4px_rgba(0,0,0,0.05)] border border-gray-100 hover:bg-white transition-all opacity-0 group-hover:opacity-100"
        >
          <Eye size={14} className="text-gray-600" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-amu-green text-sm mb-1">
          {item.name}
        </h3>
        {item.itemCode && (
          <p className="font-mono text-[10px] text-gray-400 mb-2">
            {item.itemCode}
          </p>
        )}

        {/* Variant Select */}
        {item.variants.length > 0 && (
          <select
            value={selectedVariant}
            onChange={(e) => setSelectedVariant(e.target.value)}
            className="w-full px-2 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-amu-green/30 mb-2"
          >
            {item.variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        )}

        {/* Quantity + Add to Cart */}
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-gray-200 rounded-lg">
            <button
              onClick={() => setQty(Math.max(1, qty - 1))}
              className="px-2 py-1 text-gray-500 hover:text-amu-green"
            >
              <Minus size={14} />
            </button>
            <span className="px-2 text-sm font-medium min-w-[24px] text-center">
              {qty}
            </span>
            <button
              onClick={() => setQty(qty + 1)}
              className="px-2 py-1 text-gray-500 hover:text-amu-green"
            >
              <Plus size={14} />
            </button>
          </div>
          <button
            onClick={() => {
              onAddToCart(item, variant, qty);
              setQty(1);
            }}
            className="flex-1 px-3 py-1.5 rounded-lg bg-amu-green text-white text-xs font-medium hover:bg-amu-green-mid transition-all flex items-center justify-center gap-1"
          >
            <Plus size={14} /> Add
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────── ITEM DETAIL MODAL ────────────────────

function ItemDetailModal({
  item,
  onClose,
  onAddToCart,
}: {
  item: Item;
  onClose: () => void;
  onAddToCart: (item: Item, variant: ItemVariant | null, qty: number) => void;
}) {
  const [selectedVariant, setSelectedVariant] = useState<string>(
    item.variants[0]?.id || ""
  );
  const [qty, setQty] = useState(1);
  const variant = item.variants.find((v) => v.id === selectedVariant) || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto animate-fade-in">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className="px-2 py-0.5 rounded-full bg-amu-green/10 text-amu-green text-xs font-medium">
                {item.category.name}
              </span>
              <h2 className="text-xl font-bold text-amu-green mt-2">
                {item.name}
              </h2>
              {item.itemCode && (
                <p className="font-mono text-xs text-gray-400">
                  {item.itemCode}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>

          {/* Image */}
          <div className="relative w-full h-[320px] bg-white rounded-xl mb-6 flex items-center justify-center p-2 border border-gray-100 shadow-sm">
            {variant?.image || item.mainImage ? (
              <img
                src={variant?.image || item.mainImage}
                alt={item.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <Package size={64} className="text-gray-300" />
            )}
          </div>

          {/* Description & Specs */}
          {item.description && (
            <div className="mb-4">
              <h3 className="font-semibold text-sm text-gray-700 mb-1">
                Description
              </h3>
              <p className="text-sm text-gray-600">{item.description}</p>
            </div>
          )}
          {item.specifications && (
            <div className="mb-4">
              <h3 className="font-semibold text-sm text-gray-700 mb-1">
                Specifications
              </h3>
              <p className="text-sm text-gray-600">{item.specifications}</p>
            </div>
          )}

          {/* Variants */}
          {item.variants.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold text-sm text-gray-700 mb-2">
                Select Variant
              </h3>
              <div className="flex flex-wrap gap-2">
                {item.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                      selectedVariant === v.id
                        ? "border-amu-green bg-amu-green/5 text-amu-green font-medium"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add to Cart */}
          <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center border border-gray-200 rounded-lg">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="px-3 py-2 text-gray-500 hover:text-amu-green"
              >
                <Minus size={16} />
              </button>
              <span className="px-3 text-sm font-medium">{qty}</span>
              <button
                onClick={() => setQty(qty + 1)}
                className="px-3 py-2 text-gray-500 hover:text-amu-green"
              >
                <Plus size={16} />
              </button>
            </div>
            <button
              onClick={() => {
                onAddToCart(item, variant, qty);
                onClose();
              }}
              className="flex-1 px-4 py-2.5 rounded-lg bg-amu-green text-white font-medium hover:bg-amu-green-mid transition-all flex items-center justify-center gap-2"
            >
              <ShoppingCart size={18} /> Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────── CART SIDEBAR ────────────────────

function CartSidebar({ onClose }: { onClose: () => void }) {
  const cart = useCartStore();

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl animate-slide-in-right flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-amu-green text-white">
          <h2 className="font-bold flex items-center gap-2">
            <ShoppingCart size={20} />
            Cart ({cart.items.length} items)
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10">
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.items.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ShoppingCart size={40} className="mx-auto mb-2 opacity-30" />
              <p>Your cart is empty</p>
              <p className="text-xs mt-1">
                Browse the catalogue to add items
              </p>
            </div>
          ) : (
            cart.items.map((item) => (
              <div
                key={item.id}
                className="bg-gray-50 rounded-xl p-3 border border-gray-100"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm text-amu-green">
                      {item.itemName}
                    </h4>
                    {item.variantLabel && (
                      <p className="text-xs text-gray-400">
                        {item.variantLabel}
                      </p>
                    )}
                    <p className="text-[10px] text-gray-300">
                      {item.categoryName}
                    </p>
                  </div>
                  <button
                    onClick={() => cart.removeItem(item.id)}
                    className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-400">Qty:</span>
                  <div className="flex items-center border border-gray-200 rounded bg-white">
                    <button
                      onClick={() =>
                        cart.updateQuantity(item.id, item.quantity - 1)
                      }
                      className="px-2 py-0.5 text-gray-500"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="px-2 text-sm font-medium">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        cart.updateQuantity(item.id, item.quantity + 1)
                      }
                      className="px-2 py-0.5 text-gray-500"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.items.length > 0 && (
          <div className="p-5 border-t border-gray-100 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] space-y-3 shrink-0">
            <button
              onClick={() => cart.clearCart()}
              className="w-full py-2.5 rounded-lg border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 hover:border-red-300 transition-all"
            >
              Clear Cart
            </button>
            <Link
              href="/indents/new?step=items"
              className="block w-full py-3 rounded-lg bg-amu-gold text-amu-green font-bold text-center hover:bg-amu-gold-light hover:shadow-lg transition-all transform hover:-translate-y-0.5"
            >
              Proceed to Checkout →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
