import { Link } from "react-router";
import { ArrowRight, ShoppingBag } from "lucide-react";
import type { Product } from "@/types";
import { discountPercent, formatBRL } from "@/lib/utils";
import { Swatch } from "./Swatch";
import { Skeleton } from "./ui/skeleton";

const colorsOf = (product: Product) => {
  const map = new Map<string, string>();
  product.variants.forEach((v) => {
    if (!map.has(v.color)) map.set(v.color, v.colorHex ?? "#d4d4d4");
  });
  return [...map].map(([name, hex]) => ({ name, hex }));
};

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const off = discountPercent(product.price, product.compareAtPrice);
  const image = product.images[0];
  return (
    <article className="group">
      <Link to={`/produto/${product.slug}`} className="block rounded-2xl">
        <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-muted">
          {image ? (
            <img
              src={image}
              alt={product.name}
              width={600}
              height={800}
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : undefined}
              decoding="async"
              className="size-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <span className="grid size-full place-items-center text-muted-foreground">
              <ShoppingBag className="size-8" />
            </span>
          )}
          <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
            {product.isNew && (
              <span className="rounded-full bg-white px-2.5 py-1 text-sm font-semibold shadow-sm">Novidade</span>
            )}
            {off > 0 && <span className="rounded-full bg-wine px-2.5 py-1 text-sm font-semibold text-white">-{off}%</span>}
            {!product.inStock && (
              <span className="rounded-full bg-ink px-2.5 py-1 text-sm font-semibold text-white">Esgotado</span>
            )}
          </div>
        </div>
        <div className="mt-3 px-0.5">
          <h3 className="line-clamp-2 font-sans text-sm font-medium leading-snug">{product.name}</h3>
          <p className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-sm font-bold text-wine">{formatBRL(product.price)}</span>
            {product.compareAtPrice ? (
              <span className="text-sm text-muted-foreground line-through">{formatBRL(product.compareAtPrice)}</span>
            ) : null}
          </p>
          <div className="mt-2 flex gap-1.5">
            {colorsOf(product).map((c) => (
              <Swatch key={c.name} hex={c.hex} />
            ))}
          </div>
          <span className="mt-3 flex min-h-11 items-center justify-between rounded-full border border-border px-4 text-sm font-medium transition-colors duration-200 group-hover:border-wine group-hover:text-wine">
            Ver produto
            <ArrowRight className="size-4" />
          </span>
        </div>
      </Link>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-[3/4] w-full" />
      <Skeleton className="mt-3 h-4 w-3/4 rounded-full" />
      <Skeleton className="mt-2 h-4 w-1/3 rounded-full" />
      <Skeleton className="mt-3 h-11 w-full rounded-full" />
    </div>
  );
}
