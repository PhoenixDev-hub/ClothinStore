import axios from "axios"
import { SEED_PRODUCTS } from "./seed"
import type {
  AdminStats,
  Category,
  CepResult,
  Product,
  ProductCreate,
  ProductFacets,
  StoreSettings,
} from "./types"

const CATALOG_KEY = "lookshow_catalog_v1"
const SETTINGS_KEY = "lookshow_settings_v1"
const SESSION_KEY = "lookshow_admin_session"
const ADMIN_PASSWORD = "lookshow"
const ADMIN_PASSWORDS = new Set([ADMIN_PASSWORD, "admin"])

// Cliente HTTP do backend NestJS, preservado para quando a vitrine passar a
// consumir a API real. A camada abaixo funciona como catálogo local/offline.
export const api = axios.create({
  baseURL: "http://localhost:3001/api",
  headers: {
    "Content-Type": "application/json",
  },
})

export class ApiError extends Error {
  status: number
  body: unknown

  constructor(status: number, body: unknown) {
    super(`request failed with ${status}`)
    this.name = "ApiError"
    this.status = status
    this.body = body
  }
}

type JsonBody = unknown

const wait = (ms = 140) => new Promise((resolve) => setTimeout(resolve, ms))
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T

function readProducts(): Product[] {
  try {
    const raw = localStorage.getItem(CATALOG_KEY)
    if (!raw) {
      const seeded = clone(SEED_PRODUCTS)
      localStorage.setItem(CATALOG_KEY, JSON.stringify(seeded))
      return seeded
    }
    return JSON.parse(raw) as Product[]
  } catch {
    return clone(SEED_PRODUCTS)
  }
}

function writeProducts(products: Product[]) {
  localStorage.setItem(CATALOG_KEY, JSON.stringify(products))
}

function readSettings(): StoreSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? (JSON.parse(raw) as StoreSettings) : { whatsapp_number: "5511999998888" }
  } catch {
    return { whatsapp_number: "5511999998888" }
  }
}

function isAdmin() {
  return sessionStorage.getItem(SESSION_KEY) === "1"
}

function requireAdmin() {
  if (!isAdmin()) throw new ApiError(401, { detail: "Não autenticado" })
}

function parseList(value: string | null) {
  return value ? value.split(",").filter(Boolean) : []
}

function matchesFilters(product: Product, params: URLSearchParams) {
  const q = (params.get("q") ?? "").trim().toLowerCase()
  if (q && !`${product.name} ${product.description}`.toLowerCase().includes(q)) return false

  const tag = params.get("tag")
  if (tag === "new" && !product.is_new) return false
  if (tag === "bestseller" && !product.is_bestseller) return false

  const categories = parseList(params.get("category"))
  if (categories.length && !categories.includes(product.category)) return false

  const sizes = parseList(params.get("sizes"))
  if (sizes.length && !sizes.some((s) => product.sizes.includes(s))) return false

  const colors = parseList(params.get("colors"))
  if (colors.length && !colors.some((c) => product.colors.some((pc) => pc.name === c))) return false

  const min = Number(params.get("min_price"))
  const max = Number(params.get("max_price"))
  if (Number.isFinite(min) && params.get("min_price") && product.price < min) return false
  if (Number.isFinite(max) && params.get("max_price") && product.price > max) return false

  return true
}

function sortProducts(products: Product[], sort: string | null) {
  const list = [...products]
  switch (sort) {
    case "price_asc":
      return list.sort((a, b) => a.price - b.price)
    case "price_desc":
      return list.sort((a, b) => b.price - a.price)
    case "name":
      return list.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
    default:
      return list.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
  }
}

function facetData(products: Product[]): ProductFacets {
  const sizeOrder = ["PP", "P", "M", "G", "GG", "XG", "Único", "2", "4", "6", "8", "10", "12"]
  const sizes = Array.from(new Set(products.flatMap((p) => p.sizes))).sort((a, b) => {
    const ia = sizeOrder.indexOf(a)
    const ib = sizeOrder.indexOf(b)
    if (ia === -1 && ib === -1) return a.localeCompare(b, "pt-BR")
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  })
  const colorMap = new Map<string, string>()
  products.forEach((p) => p.colors.forEach((c) => colorMap.set(c.name, c.hex)))
  const prices = products.map((p) => p.price)
  return {
    sizes,
    colors: Array.from(colorMap, ([name, hex]) => ({ name, hex })),
    min_price: prices.length ? Math.min(...prices) : 0,
    max_price: prices.length ? Math.max(...prices) : 0,
  }
}

async function fakeRequest<T>(method: string, path: string, body?: JsonBody): Promise<T> {
  await wait()
  const url = new URL(path, "https://local.lookshow")
  const pathname = url.pathname
  const params = url.searchParams
  const products = readProducts()

  // Produtos ---------------------------------------------------------------
  if (method === "GET" && pathname === "/products") {
    const filtered = sortProducts(
      products.filter((p) => matchesFilters(p, params)),
      params.get("sort"),
    )
    const limit = Number(params.get("limit"))
    return (Number.isFinite(limit) && limit > 0 ? filtered.slice(0, limit) : filtered) as T
  }

  if (method === "GET" && pathname === "/products/facets") {
    return facetData(products) as T
  }

  if (method === "GET" && pathname.startsWith("/products/")) {
    const id = decodeURIComponent(pathname.slice("/products/".length))
    const product = products.find((p) => p.id === id)
    if (!product) throw new ApiError(404, { detail: "Produto não encontrado" })
    return product as T
  }

  // Configurações ----------------------------------------------------------
  if (method === "GET" && pathname === "/settings") {
    return readSettings() as T
  }

  // CEP --------------------------------------------------------------------
  if (method === "GET" && pathname.startsWith("/cep/")) {
    const cep = pathname.slice("/cep/".length).replace(/\D/g, "")
    if (cep.length !== 8) throw new ApiError(400, { detail: "CEP inválido" })
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
    if (!response.ok) throw new ApiError(404, { detail: "CEP não encontrado" })
    const data = (await response.json()) as {
      erro?: boolean
      logradouro?: string
      bairro?: string
      localidade?: string
      uf?: string
    }
    if (data.erro) throw new ApiError(404, { detail: "CEP não encontrado" })
    const result: CepResult = {
      street: data.logradouro ?? "",
      neighborhood: data.bairro ?? "",
      city: data.localidade ?? "",
      state: data.uf ?? "",
    }
    return result as T
  }

  // Administração ----------------------------------------------------------
  if (method === "GET" && pathname === "/admin/me") {
    return { authenticated: isAdmin() } as T
  }

  if (method === "POST" && pathname === "/admin/login") {
    const password = (body as { password?: string } | undefined)?.password ?? ""
    if (!ADMIN_PASSWORDS.has(password)) throw new ApiError(401, { detail: "Senha incorreta" })
    sessionStorage.setItem(SESSION_KEY, "1")
    return { authenticated: true } as T
  }

  if (method === "GET" && pathname === "/admin/stats") {
    requireAdmin()
    const stats: AdminStats = {
      total_products: products.length,
      demo_products: products.filter((p) => p.is_demo).length,
      low_stock: products.filter((p) => p.stock > 0 && p.stock <= 5).length,
      out_of_stock: products.filter((p) => p.stock <= 0).length,
    }
    return stats as T
  }

  if (method === "PUT" && pathname === "/admin/settings") {
    requireAdmin()
    const number = String((body as { whatsapp_number?: string } | undefined)?.whatsapp_number ?? "").replace(/\D/g, "")
    if (number.length < 10) throw new ApiError(400, { detail: "Número inválido" })
    const settings = { whatsapp_number: number }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    return settings as T
  }

  if (method === "POST" && pathname === "/admin/products") {
    requireAdmin()
    const data = body as ProductCreate
    const product: Product = {
      ...data,
      id: crypto.randomUUID(),
      is_demo: false,
      created_at: new Date().toISOString(),
    }
    writeProducts([product, ...products])
    return product as T
  }

  if (method === "PUT" && pathname.startsWith("/admin/products/")) {
    requireAdmin()
    const id = pathname.slice("/admin/products/".length)
    const index = products.findIndex((p) => p.id === id)
    if (index === -1) throw new ApiError(404, { detail: "Produto não encontrado" })
    const updated: Product = {
      ...products[index],
      ...(body as Partial<ProductCreate>),
    }
    const next = [...products]
    next[index] = updated
    writeProducts(next)
    return updated as T
  }

  if (method === "DELETE" && pathname.startsWith("/admin/products/")) {
    requireAdmin()
    const id = pathname.slice("/admin/products/".length)
    writeProducts(products.filter((p) => p.id !== id))
    return { deleted: 1 } as T
  }

  if (method === "DELETE" && pathname === "/admin/demo") {
    requireAdmin()
    const keep = products.filter((p) => !p.is_demo)
    const deleted = products.length - keep.length
    writeProducts(keep)
    return { deleted } as T
  }

  if (method === "POST" && pathname === "/admin/demo/restore") {
    requireAdmin()
    const existing = new Set(products.map((p) => p.id))
    const missing = clone(SEED_PRODUCTS).filter((p) => !existing.has(p.id))
    writeProducts([...missing, ...products])
    return { inserted: missing.length } as T
  }

  // Uploads ----------------------------------------------------------------
  if (method === "POST" && pathname === "/admin/images") {
    requireAdmin()
    // Em produção o arquivo vai para o storage; aqui guardamos como data URL.
    return { url: "" } as T
  }

  throw new ApiError(404, { detail: `Rota não encontrada: ${method} ${pathname}` })
}

export const apiGet = <T,>(path: string) => fakeRequest<T>("GET", path)
export const apiPost = <T,>(path: string, body?: JsonBody) => fakeRequest<T>("POST", path, body ?? null)
export const apiPut = <T,>(path: string, body?: JsonBody) => fakeRequest<T>("PUT", path, body ?? null)
export const apiPatch = <T,>(path: string, body?: JsonBody) => fakeRequest<T>("PATCH", path, body ?? null)
export const apiDelete = <T,>(path: string) => fakeRequest<T>("DELETE", path)

export async function apiUpload<T>(_path: string, form: FormData): Promise<T> {
  const file = form.get("file")
  if (!(file instanceof File)) throw new ApiError(400, { detail: "Arquivo inválido" })
  if (file.size > 8 * 1024 * 1024) throw new ApiError(413, { detail: "Imagem muito grande" })
  const url = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new ApiError(400, { detail: "Falha ao ler a imagem" }))
    reader.readAsDataURL(file)
  })
  return { url } as T
}

export function resetCatalogForTests() {
  localStorage.removeItem(CATALOG_KEY)
  localStorage.removeItem(SETTINGS_KEY)
  sessionStorage.removeItem(SESSION_KEY)
}

export type { Category }
