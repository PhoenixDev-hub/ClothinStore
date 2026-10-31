import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import SafeImage from "./SafeImage";
import { useCart } from "@/lib/cart";
import { discountPct, formatBRL } from "@/lib/store";
import type { Product } from "@/lib/types";

export default function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { add, setOpen } = useCart();
  const navigate = useNavigate();
  const off = discountPct(product.price, product.compare_at_price);
  const soldOut = product.stock <= 0;

  const quickAdd = () => {
    if (soldOut) return;
    if (product.sizes.length <= 1 && product.colors.length <= 1) {
      add(product, product.sizes[0] ?? "Único", product.colors[0]?.name ?? "Única");
      toast.success(`${product.name} adicionado à sacola`);
      setOpen(true);
    } else {
      navigate(`/produto/${product.id}`);
    }
  };

  return (
    <article
      data-testid={`product-card-${product.id}`}
      className="group relative flex flex-col animate-fade-up"
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-neutral-100">
        <Link to={`/produto/${product.id}`} data-testid={`product-card-link-${product.id}`} className="block size-full">
          <SafeImage
            src={product.images[0]}
            alt={product.name}
            className="absolute inset-0 size-full transition-transform duration-700 ease-out group-hover:scale-105"
          />
          {product.images[1] && (
            <SafeImage
              src={product.images[1]}
              alt=""
              className="absolute inset-0 size-full opacity-0 transition-opacity duration-500 group-hover:opacity-100 max-md:hidden"
            />
          )}
        </Link>
        <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
          {soldOut && (
            <span className="rounded-full bg-neutral-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              Esgotado
            </span>
          )}
          {product.is_new && !soldOut && (
            <span className="rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ink shadow-sm">
              Novidade
            </span>
          )}
          {off > 0 && !soldOut && (
            <span className="rounded-full bg-wine px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              -{off}%
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={quickAdd}
          disabled={soldOut}
          aria-label={`Adicionar ${product.name} à sacola`}
          data-testid={`product-card-quick-add-${product.id}`}
          className="absolute bottom-2.5 right-2.5 flex size-10 items-center justify-center rounded-full bg-white text-ink shadow-md transition-[transform,background-color,color,opacity] duration-200 hover:bg-wine hover:text-white active:scale-90 disabled:opacity-40 md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100"
        >
          <ShoppingBag className="size-4" />
        </button>
      </div>
      <Link to={`/produto/${product.id}`} className="mt-3 flex flex-col gap-1 px-0.5">
        <h3
          data-testid={`product-card-name-${product.id}`}
          className="line-clamp-1 font-sans text-sm font-medium text-ink md:text-[15px]"
        >
          {product.name}
        </h3>
        <div className="flex items-baseline gap-2">
          <span data-testid={`product-card-price-${product.id}`} className="font-heading text-base font-semibold text-wine">
            {formatBRL(product.price)}
          </span>
          {off > 0 && (
            <span className="text-xs text-neutral-400 line-through">{formatBRL(product.compare_at_price ?? 0)}</span>
          )}
        </div>
        {product.colors.length > 0 && (
          <div className="flex items-center gap-1.5 pt-0.5">
            {product.colors.slice(0, 5).map((c) => (
              <span
                key={c.name}
                title={c.name}
                className="size-3 rounded-full ring-1 ring-black/15"
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        )}
      </Link>
    </article>
  );
}
