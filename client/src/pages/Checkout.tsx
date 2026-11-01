import { useState } from "react";
import { Link } from "react-router";
import { ChevronRight, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { useCart, cartTotal } from "@/store/cart";
import { useSettings } from "@/hooks/queries";
import { formatBRL } from "@/lib/utils";

const PAYMENTS = ["Pix", "Cartão de crédito", "Cartão de débito", "Combinar no WhatsApp"];
const DELIVERY = ["Correios", "Motoboy", "Retirada na loja"];

export default function Checkout() {
  const { items, clear } = useCart();
  const { data: settings } = useSettings();
  const [form, setForm] = useState({ name: "", phone: "", address: "", delivery: DELIVERY[0], payment: PAYMENTS[0], notes: "" });
  const total = cartTotal(items);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings?.whatsapp) return toast.error("WhatsApp da loja não configurado.");
    const lines = [
      "*Novo pedido — Look Show*",
      "",
      ...items.map((i) => `• ${i.qty}x ${i.name}${i.color ? ` (${i.color}` : ""}${i.size ? `${i.color ? ", " : " ("}Tam. ${i.size}` : ""}${i.color || i.size ? ")" : ""} — ${formatBRL(i.price * i.qty)}`),
      "",
      `*Total:* ${formatBRL(total)}`,
      "",
      `*Nome:* ${form.name}`,
      `*Telefone:* ${form.phone}`,
      `*Entrega:* ${form.delivery}${form.delivery !== "Retirada na loja" ? ` — ${form.address}` : ""}`,
      `*Pagamento:* ${form.payment}`,
      form.notes ? `*Observações:* ${form.notes}` : null,
    ].filter((l): l is string => l !== null);
    window.open(`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank", "noopener");
    clear();
    toast.success("Pedido enviado! Continue a conversa no WhatsApp.");
  };

  if (items.length === 0)
    return (
      <div className="container-shop grid place-items-center py-32 text-center">
        <div>
          <h1 className="text-2xl font-bold">Seu carrinho está vazio</h1>
          <p className="mt-2 text-sm text-muted-foreground">Adicione peças para finalizar seu pedido.</p>
          <Button asChild className="mt-6">
            <Link to="/produtos">Ver produtos</Link>
          </Button>
        </div>
      </div>
    );

  return (
    <div className="container-shop pb-6 pt-6">
      <nav className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Início</Link>
        <ChevronRight className="size-3" />
        <span className="font-medium text-foreground">Checkout</span>
      </nav>
      <h1 className="mt-3 text-[34px] font-bold leading-none">Finalizar pedido</h1>

      <form onSubmit={submit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5 rounded-3xl border border-border bg-white p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Nome completo</Label>
              <Input id="name" required value={form.name} onChange={set("name")} />
            </div>
            <div>
              <Label htmlFor="phone">WhatsApp</Label>
              <Input id="phone" required inputMode="tel" placeholder="(11) 99999-8888" value={form.phone} onChange={set("phone")} />
            </div>
          </div>
          <div>
            <Label>Entrega</Label>
            <div className="flex flex-wrap gap-2">
              {DELIVERY.map((d) => (
                <button type="button" key={d} onClick={() => setForm((f) => ({ ...f, delivery: d }))} className={`h-9 rounded-full border px-4 text-xs font-medium transition ${form.delivery === d ? "border-ink bg-ink text-white" : "border-border hover:border-ink"}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          {form.delivery !== "Retirada na loja" && (
            <div>
              <Label htmlFor="address">Endereço completo</Label>
              <Input id="address" required value={form.address} onChange={set("address")} placeholder="Rua, número, bairro, cidade e CEP" />
            </div>
          )}
          <div>
            <Label>Pagamento</Label>
            <div className="flex flex-wrap gap-2">
              {PAYMENTS.map((d) => (
                <button type="button" key={d} onClick={() => setForm((f) => ({ ...f, payment: d }))} className={`h-9 rounded-full border px-4 text-xs font-medium transition ${form.payment === d ? "border-ink bg-ink text-white" : "border-border hover:border-ink"}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea id="notes" value={form.notes} onChange={set("notes")} />
          </div>
        </div>

        <aside className="h-fit space-y-4 rounded-3xl border border-border bg-white p-6 lg:sticky lg:top-24">
          <h2 className="text-base font-semibold">Resumo</h2>
          <ul className="space-y-3">
            {items.map((i) => (
              <li key={i.key} className="flex gap-3 text-xs">
                <img src={i.image} alt="" className="h-14 w-11 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{i.name}</p>
                  <p className="text-[10px] text-muted-foreground">{[i.color, i.size && `Tam. ${i.size}`, `${i.qty}x`].filter(Boolean).join(" · ")}</p>
                </div>
                <span className="font-semibold">{formatBRL(i.price * i.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="text-xs text-muted-foreground">Total</span>
            <span className="font-display text-xl font-bold text-wine">{formatBRL(total)}</span>
          </div>
          <Button type="submit" variant="whatsapp" size="lg" className="w-full">
            <MessageCircle /> Enviar pedido pelo WhatsApp
          </Button>
          <p className="text-center text-[10px] text-muted-foreground">Frete e pagamento combinados com atendimento humano.</p>
        </aside>
      </form>
    </div>
  );
}
