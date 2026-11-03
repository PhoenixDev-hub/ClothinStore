import { Link } from "react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cartCount, cartTotal, useCart } from "@/store/cart";
import { formatBRL } from "@/lib/utils";

export function CartDrawer() {
  const { items, open, setOpen, setQty, remove } = useCart();
  const total = cartTotal(items);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-lg font-semibold">Carrinho ({cartCount(items)})</SheetTitle>
          <SheetDescription>Revise suas peças antes de enviar o pedido.</SheetDescription>
        </SheetHeader>
        {items.length === 0 ? (
          <div className="grid flex-1 place-items-center px-6 text-center">
            <div>
              <span className="mx-auto grid size-14 place-items-center rounded-full bg-muted">
                <ShoppingBag className="size-6 text-muted-foreground" />
              </span>
              <p className="mt-4 font-display text-base font-semibold">Seu carrinho está vazio</p>
              <p className="mt-1 text-sm text-muted-foreground">Escolha suas peças e volte aqui.</p>
              <Button asChild className="mt-5" onClick={() => setOpen(false)}>
                <Link to="/produtos">Ver produtos</Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <ul className="flex-1 space-y-4 overflow-y-auto px-6 py-2">
              {items.map((i) => (
                <li key={i.sku} className="flex gap-3">
                  {i.image ? (
                    <img
                      src={i.image}
                      alt={i.name}
                      width={144}
                      height={192}
                      loading="lazy"
                      decoding="async"
                      className="h-24 w-[72px] rounded-xl object-cover"
                    />
                  ) : (
                    <span className="grid h-24 w-[72px] place-items-center rounded-xl bg-muted text-muted-foreground">
                      <ShoppingBag className="size-5" />
                    </span>
                  )}
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="truncate text-sm font-medium">{i.name}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {[i.color, i.size && `Tam. ${i.size}`].filter(Boolean).join(" · ")}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-wine">{formatBRL(i.unitPrice)}</p>
                    <div className="mt-auto flex items-center gap-2">
                      <div className="flex h-12 items-center rounded-full border border-border">
                        <button
                          type="button"
                          className="grid size-11 place-items-center rounded-full transition-colors duration-200 hover:bg-muted"
                          onClick={() => setQty(i.sku, i.qty - 1)}
                          aria-label={`Diminuir quantidade de ${i.name}`}
                        >
                          <Minus className="size-4" />
                        </button>
                        <span className="w-6 text-center text-sm font-medium">{i.qty}</span>
                        <button
                          type="button"
                          className="grid size-11 place-items-center rounded-full transition-colors duration-200 hover:bg-muted disabled:opacity-40"
                          onClick={() => setQty(i.sku, i.qty + 1)}
                          disabled={i.qty >= i.maxStock}
                          aria-label={`Aumentar quantidade de ${i.name}`}
                        >
                          <Plus className="size-4" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(i.sku)}
                        className="grid size-11 place-items-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-red-600"
                        aria-label={`Remover ${i.name} do carrinho`}
                      >
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
              <p className="text-sm text-muted-foreground">Frete e pagamento combinados no WhatsApp.</p>
              <Button asChild size="lg" className="w-full" onClick={() => setOpen(false)}>
                <Link to="/carrinho">Ver carrinho</Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
