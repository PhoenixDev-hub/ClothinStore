import type { Category } from "./types"

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
export const formatBRL = (v: number) => brl.format(v)

export const IMAGES = {
  hero: "https://images.unsplash.com/photo-1618244965061-1d27b208d6e8?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1800",
  fitnessBanner:
    "https://images.unsplash.com/photo-1584863495140-a320b13a11a8?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1800",
  editorial:
    "https://images.unsplash.com/photo-1664076458686-3449062080ac?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1200",
}

export interface CategoryInfo {
  id: Category
  label: string
  short: string
  image: string
}

const u = (p: string) => `https://images.unsplash.com/${p}?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=80&w=400`

export const CATEGORIES: CategoryInfo[] = [
  { id: "feminino", label: "Roupas Femininas", short: "Feminino", image: u("photo-1612336307429-8a898d10e223") },
  { id: "fitness", label: "Roupas Fitness", short: "Fitness", image: u("photo-1606902965551-dce093cda6e7") },
  { id: "acessorios", label: "Acessórios", short: "Acessórios", image: u("photo-1559563458-527698bf5295") },
  { id: "infantil", label: "Roupas Infantis", short: "Infantil", image: u("photo-1650602979536-74222284e5e2") },
]

export const categoryLabel = (id: string) => CATEGORIES.find((c) => c.id === id)?.label ?? id

export const SHIPPING_OPTIONS = [
  { id: "retirada", label: "Retirada na loja", desc: "Sem custo — combinamos o horário" },
  { id: "correios", label: "Correios (PAC/SEDEX)", desc: "Frete calculado e informado no WhatsApp" },
  { id: "motoboy", label: "Motoboy (a combinar)", desc: "Entrega rápida na região" },
] as const

export type ShippingId = (typeof SHIPPING_OPTIONS)[number]["id"]

export const discountPct = (price: number, compare: number | null) =>
  compare && compare > price ? Math.round((1 - price / compare) * 100) : 0
