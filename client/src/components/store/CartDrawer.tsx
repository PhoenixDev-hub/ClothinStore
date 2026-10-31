import { Link } from "react-router-dom";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { buttonVariants } from "@/components/ui/button";
import SafeImage from "./SafeImage";
import { useCart } from "@/lib/cart";
import { formatBRL } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function CartDrawer() {
  const { items, open, setOpen, setQty, remove, subtotal, count } = useCart();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md"
        data-testid="cart-drawer"
      >
        <div className="flex items-center gap-3 border-b border-neutral-100 px-5 py-4">
          <ShoppingBag className="size-5 text-wine" />
          <SheetTitle className="font-heading text-lg font-bold">Sua sacola</SheetTitle>
          <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold" data-testid="cart-drawer-count">
            {count} {count === 1 ? "item" : "itens"}
          </span>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center" data-testid="cart-empty">
            <span className="flex size-16 items-center justify-center rounded-full bg-wine-subtle">
              <ShoppingBag className="size-7 text-wine" />
            </span>
            <p className="font-heading text-lg font-semibold">Sua sacola está vazia</p>
            <p className="text-sm text-neutral-500">Que tal dar uma olhada nas novidades?</p>
            <Link
              to="/produtos"
              onClick={() => setOpen(false)}
              data-testid="cart-empty-shop-link"
              className={cn(buttonVariants({ size: "lg" }), "rounded-full px-6")}
            >
              Explorar produtos
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-neutral-100 overflow-y-auto px-5">
              {items.map((i) => (
                <li key={i.key} className="flex gap-3.5 py-4" data-testid="cart-item">
                  <Link to={`/produto/${i.product_id}`} onClick={() => setOpen(false)} className="shrink-0">
                    <SafeImage src={i.image} alt={i.name} className="h-24 w-[72px] rounded-xl" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 text-sm font-semibold leading-snug" data-testid="cart-item-name">
                        {i.name}
                      </p>
                      <button
                        type="button"
                        aria-label="Remover item"
                        data-testid="cart-item-remove"
                        onClick={() => remove(i.key)}
                        className="-mr-1 flex size-8 shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors duration-200 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <p className="mt-0.5 text-xs text-neutral-500" data-testid="cart-item-variant">
                      Tam: {i.size} · Cor: {i.color}
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-full border border-neutral-200">
                        <button
                          type="button"
                          aria-label="Diminuir quantidade"
                          data-testid="cart-item-decrease"
                          onClick={() => setQty(i.key, i.quantity - 1)}
                          disabled={i.quantity <= 1}
                          className="flex size-8 items-center justify-center rounded-full transition-colors duration-200 hover:bg-neutral-100 disabled:opacity-30"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="w-7 text-center text-sm font-semibold" data-testid="cart-item-qty">
                          {i.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Aumentar quantidade"
                          data-testid="cart-item-increase"
                          onClick={() => setQty(i.key, i.quantity + 1)}
                          disabled={i.quantity >= i.max}
                          className="flex size-8 items-center justify-center rounded-full transition-colors duration-200 hover:bg-neutral-100 disabled:opacity-30"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      <span className="font-heading text-sm font-bold text-wine">{formatBRL(i.price * i.quantity)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-neutral-100 bg-neutral-50/80 px-5 pb-6 pt-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-neutral-600">Subtotal</span>
                <span className="font-heading text-2xl font-bold text-ink" data-testid="cart-subtotal">
                  {formatBRL(subtotal)}
                </span>
              </div>
              <p className="mt-1 text-xs text-neutral-500">Frete e pagamento combinados pelo WhatsApp.</p>
              <Link
                to="/checkout"
                onClick={() => setOpen(false)}
                data-testid="cart-checkout-button"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "mt-4 h-12 w-full rounded-full text-[15px] font-semibold transition-transform duration-150 active:scale-[0.98]",
                )}
              >
                Finalizar pedido
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                data-testid="cart-continue-button"
                className="mt-2 w-full rounded-full py-2.5 text-sm font-medium text-neutral-600 transition-colors duration-200 hover:text-ink"
              >
                Continuar comprando
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
