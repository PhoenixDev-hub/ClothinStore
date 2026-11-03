import { Link } from "react-router";
import { ChevronRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { cartTotal, useCart } from "@/store/cart";
import { formatBRL } from "@/lib/utils";

export default function Cart() {
  const { items, setQty, remove } = useCart();
  const total = cartTotal(items);

  if (items.length === 0)
    return (
      <div className="container-shop grid place-items-center py-32 text-center">
        <div>
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-muted">
            <ShoppingBag className="size-6 text-muted-foreground" />
          </span>
          <h1 className="mt-4 text-2xl font-bold">Seu carrinho está vazio</h1>
          <p className="mt-2 text-sm text-muted-foreground">Adicione peças para enviar seu pedido.</p>
          <Button asChild className="mt-6">
            <Link to="/produtos">Ver produtos</Link>
          </Button>
        </div>
      </div>
    );

  return (
    <div className="container-shop pb-6 pt-6">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground" aria-label="Você está aqui">
        <Link to="/" className="inline-flex min-h-11 min-w-11 items-center px-1 transition-colors duration-200 hover:text-foreground">
          Início
        </Link>
        <ChevronRight className="size-4" />
        <span className="inline-flex min-h-11 items-center px-1 font-medium text-foreground">Carrinho</span>
      </nav>
      <h1 className="mt-2 text-3xl font-bold leading-none sm:text-4xl">Carrinho</h1>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_360px]">
        <ul className="divide-y divide-border rounded-3xl border border-border bg-white px-5">
          {items.map((item) => (
            <li key={item.sku} className="flex gap-4 py-5">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  width={168}
                  height={224}
                  loading="lazy"
                  decoding="async"
                  className="h-28 w-[84px] rounded-xl object-cover"
                />
              ) : (
                <span className="grid h-28 w-[84px] place-items-center rounded-xl bg-muted text-muted-foreground">
                  <ShoppingBag className="size-6" />
                </span>
              )}
              <div className="flex min-w-0 flex-1 flex-col">
                <Link
                  to={`/produto/${item.slug}`}
                  className="inline-flex min-h-11 items-center truncate text-sm font-medium transition-colors duration-200 hover:text-wine"
                >
                  {item.name}
                </Link>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {[item.color, item.size && `Tam. ${item.size}`].filter(Boolean).join(" · ")}
                </p>
                <p className="mt-1 text-sm font-semibold text-wine">{formatBRL(item.unitPrice)}</p>
                <div className="mt-auto flex flex-wrap items-center gap-3">
                  <div className="flex h-12 items-center rounded-full border border-border">
                    <button
                      type="button"
                      className="grid size-11 place-items-center rounded-full transition-colors duration-200 hover:bg-muted"
                      onClick={() => setQty(item.sku, item.qty - 1)}
                      aria-label={`Diminuir quantidade de ${item.name}`}
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="w-6 text-center text-sm font-medium">{item.qty}</span>
                    <button
                      type="button"
                      className="grid size-11 place-items-center rounded-full transition-colors duration-200 hover:bg-muted disabled:opacity-40"
                      onClick={() => setQty(item.sku, item.qty + 1)}
                      disabled={item.qty >= item.maxStock}
                      aria-label={`Aumentar quantidade de ${item.name}`}
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.qty >= item.maxStock && <span className="text-sm text-muted-foreground">Máx. {item.maxStock}</span>}
                    <button
                      type="button"
                      onClick={() => remove(item.sku)}
                      className="grid size-11 place-items-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-red-600"
                      aria-label={`Remover ${item.name} do carrinho`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
              <span className="self-start text-sm font-semibold">{formatBRL(item.unitPrice * item.qty)}</span>
            </li>
          ))}
        </ul>

        <aside className="h-fit space-y-4 rounded-3xl border border-border bg-white p-6 lg:sticky lg:top-24">
          <h2 className="text-base font-semibold">Resumo</h2>
          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="text-sm text-muted-foreground">Subtotal</span>
            <span className="font-display text-xl font-bold text-wine">{formatBRL(total)}</span>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            O valor final e a disponibilidade são conferidos na loja. Frete e pagamento combinados no WhatsApp.
          </p>
          <WhatsAppButton className="w-full" />
          <Button asChild variant="outline" className="w-full">
            <Link to="/produtos">Continuar comprando</Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}
