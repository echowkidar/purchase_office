import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string; // unique cart item id
  itemId: string;
  itemName: string;
  itemImage?: string;
  categoryName?: string;
  variantId?: string;
  variantLabel?: string;
  quantity: number;
  // 3 years history (filled in Step 3)
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
  usedByName?: string; // Name of the person who will use this item
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateHistory: (id: string, history: Partial<CartItem>) => void;
  clearCart: () => void;
  getCartCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const id = `${item.itemId}-${item.variantId || "default"}-${Date.now()}`;
        // Check if same item + variant already in cart
        const existing = get().items.find(
          (i) => i.itemId === item.itemId && i.variantId === item.variantId
        );
        if (existing) {
          set((state) => ({
            items: state.items.map((i) =>
              i.id === existing.id
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          }));
        } else {
          set((state) => ({
            items: [...state.items, { ...item, id }],
          }));
        }
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        }));
      },

      updateQuantity: (id, quantity) => {
        if (quantity < 1) return;
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, quantity } : i
          ),
        }));
      },

      updateHistory: (id, history) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, ...history } : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getCartCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: "cpo-cart",
    }
  )
);
