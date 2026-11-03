import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types";

interface CartState {
  items: CartItem[];
  open: boolean;
  setOpen: (open: boolean) => void;
  add: (item: Omit<CartItem, "qty"> & { qty?: number }) => void;
  setQty: (sku: string, qty: number) => void;
  setMaxStock: (sku: string, stock: number) => void;
  remove: (sku: string) => void;
  clear: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      open: false,
      setOpen: (open) => set({ open }),
      add: (item) =>
        set((state) => {
          const max = Math.max(0, item.maxStock);
          if (max === 0) return state;
          const qty = Math.min(Math.max(1, item.qty ?? 1), max);
          const found = state.items.find((i) => i.sku === item.sku);
          const items = found
            ? state.items.map((i) =>
                i.sku === item.sku ? { ...i, maxStock: max, qty: Math.min(i.qty + qty, max) } : i,
              )
            : [...state.items, { ...item, qty, maxStock: max }];
          return { items, open: true };
        }),
      setQty: (sku, qty) =>
        set((state) => ({
          items:
            qty <= 0
              ? state.items.filter((i) => i.sku !== sku)
              : state.items.map((i) =>
                  i.sku === sku ? { ...i, qty: Math.min(qty, Math.max(i.maxStock, 1)) } : i,
                ),
        })),
      setMaxStock: (sku, stock) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.sku === sku
              ? { ...i, maxStock: Math.max(stock, 0), qty: Math.max(1, Math.min(i.qty, Math.max(stock, 0))) }
              : i,
          ),
        })),
      remove: (sku) => set((state) => ({ items: state.items.filter((i) => i.sku !== sku) })),
      clear: () => set({ items: [] }),
    }),
    { name: "lookshow:cart", partialize: (state) => ({ items: state.items }) },
  ),
);

export const cartCount = (items: CartItem[]) => items.reduce((total, item) => total + item.qty, 0);
export const cartTotal = (items: CartItem[]) =>
  items.reduce((total, item) => total + item.qty * item.unitPrice, 0);
