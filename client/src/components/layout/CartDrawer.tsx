import { Link } from "react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart, cartTotal, cartCount } from "@/store/cart";
import { formatBRL } from "@/lib/utils";

export function CartDrawer() {
  const { items, open, setOpen, setQty, remove } = useCart();
  const total = cartTotal(items);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent title={`Carrinho (${cartCount(items)})`} description="Revise suas peças antes de finalizar pelo WhatsApp.">
        {items.length === 0 ? (
          <div className="grid flex-1 place-items-center px-6 text-center">
            <div>
              <span className="mx-auto grid size-14 place-items-center rounded-full bg-muted">
                <ShoppingBag className="size-6 text-muted-foreground" />
              </span>
              <p className="mt-4 font-display text-base font-semibold">Seu carrinho está vazio</p>
              <p className="mt-1 text-xs text-muted-foreground">Escolha suas peças favoritas e volte aqui.</p>
              <Button asChild className="mt-5" onClick={() => setOpen(false)}>
                <Link to="/produtos">Ver produtos</Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <ul className="flex-1 space-y-4 overflow-y-auto px-6 py-2">
              {items.map((i) => (
                <li key={i.key} className="flex gap-3">
                  <img src={i.image} alt="" className="h-24 w-[72px] rounded-xl object-cover" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="truncate text-sm font-medium">{i.name}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{[i.color, i.size && `Tam. ${i.size}`].filter(Boolean).join(" · ")}</p>
                    <p className="mt-1 text-sm font-semibold text-wine">{formatBRL(i.price)}</p>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex h-8 items-center rounded-full border border-border">
                        <button className="grid size-8 place-items-center" onClick={() => setQty(i.key, i.qty - 1)} aria-label="Diminuir">
                          <Minus className="size-3" />
                        </button>
                        <span className="w-5 text-center text-xs font-medium">{i.qty}</span>
                        <button className="grid size-8 place-items-center" onClick={() => setQty(i.key, i.qty + 1)} aria-label="Aumentar">
                          <Plus className="size-3" />
                        </button>
                      </div>
                      <button onClick={() => remove(i.key)} className="text-muted-foreground transition hover:text-red-600" aria-label="Remover">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="space-y-3 border-t border-border px-6 py-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-display text-lg font-semibold">{formatBRL(total)}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">Frete e pagamento combinados no WhatsApp.</p>
              <Button asChild size="lg" className="w-full" onClick={() => setOpen(false)}>
                <Link to="/checkout">Finalizar pedido</Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
