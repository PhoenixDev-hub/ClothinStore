import type { CartItem } from "./cart"
import { formatBRL, SHIPPING_OPTIONS } from "./store"
import type { ShippingId } from "./store"

export interface CheckoutData {
  name: string
  phone: string
  shipping: ShippingId
  cep: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
  notes: string
}

export function buildOrderMessage(d: CheckoutData, items: CartItem[], subtotal: number): string {
  const shipping = SHIPPING_OPTIONS.find((s) => s.id === d.shipping)?.label ?? d.shipping
  const lines: string[] = ["*NOVO PEDIDO - LOOK SHOW*", "", `*Cliente:* ${d.name.trim()}`]
  if (d.phone.trim()) lines.push(`*Telefone:* ${d.phone.trim()}`)
  lines.push("", "*Itens do pedido:*")
  items.forEach((i, idx) => {
    lines.push(
      `${idx + 1}. ${i.name}`,
      `   Tamanho: ${i.size} | Cor: ${i.color} | Qtd: ${i.quantity}`,
      `   ${i.quantity} x ${formatBRL(i.price)} = ${formatBRL(i.price * i.quantity)}`,
    )
  })
  lines.push("", `*Subtotal:* ${formatBRL(subtotal)}`, `*Forma de envio:* ${shipping}`, "")
  if (d.shipping === "retirada") {
    lines.push("*Entrega:* Retirada na loja")
  } else {
    const addr = [d.street.trim(), d.number.trim()].filter(Boolean).join(", ")
    lines.push(
      "*Endereço de entrega:*",
      `${addr}${d.complement.trim() ? ` - ${d.complement.trim()}` : ""}`,
      `${d.neighborhood.trim()} - ${d.city.trim()}/${d.state.trim().toUpperCase()}`,
      `CEP: ${d.cep.trim()}`,
    )
  }
  if (d.notes.trim()) lines.push("", `*Observações:* ${d.notes.trim()}`)
  return lines.join("\n")
}

export const whatsappUrl = (number: string, message: string) =>
  `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`

export const formatCep = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 8)
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
}

export const formatPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`
}
