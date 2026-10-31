import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import type { Product } from "./types"

export interface CartItem {
  key: string
  product_id: string
  name: string
  image: string
  price: number
  size: string
  color: string
  quantity: number
  max: number
}

interface CartCtx {
  items: CartItem[]
  count: number
  subtotal: number
  open: boolean
  setOpen: (v: boolean) => void
  add: (p: Product, size: string, color: string, qty?: number) => void
  setQty: (key: string, qty: number) => void
  remove: (key: string) => void
  clear: () => void
}

const STORAGE = "lookshow_cart_v1"
const Ctx = createContext<CartCtx | null>(null)

function load(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE)
    return raw ? (JSON.parse(raw) as CartItem[]) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(load)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify(items))
  }, [items])

  const add = useCallback((p: Product, size: string, color: string, qty = 1) => {
    const key = `${p.id}|${size}|${color}`
    const max = Math.max(p.stock, 1)
    setItems((prev) => {
      const found = prev.find((i) => i.key === key)
      if (found) {
        return prev.map((i) => (i.key === key ? { ...i, quantity: Math.min(i.quantity + qty, max) } : i))
      }
      return [
        ...prev,
        {
          key,
          product_id: p.id,
          name: p.name,
          image: p.images[0] ?? "",
          price: p.price,
          size,
          color,
          quantity: Math.min(qty, max),
          max,
        },
      ]
    })
  }, [])

  const setQty = useCallback((key: string, qty: number) => {
    setItems((prev) =>
      prev.map((i) => (i.key === key ? { ...i, quantity: Math.max(1, Math.min(qty, i.max)) } : i)),
    )
  }, [])

  const remove = useCallback((key: string) => setItems((prev) => prev.filter((i) => i.key !== key)), [])
  const clear = useCallback(() => setItems([]), [])

  const value = useMemo<CartCtx>(
    () => ({
      items,
      count: items.reduce((s, i) => s + i.quantity, 0),
      subtotal: items.reduce((s, i) => s + i.quantity * i.price, 0),
      open,
      setOpen,
      add,
      setQty,
      remove,
      clear,
    }),
    [items, open, add, setQty, remove, clear],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCart(): CartCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useCart must be used inside CartProvider")
  return ctx
}
