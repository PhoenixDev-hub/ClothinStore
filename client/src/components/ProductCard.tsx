import { Link } from "react-router";
import { motion } from "motion/react";
import type { Product } from "@/types";
import { discountPercent, formatBRL } from "@/lib/utils";
import { Swatch } from "./Swatch";
import { Skeleton } from "./ui/skeleton";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const off = discountPercent(product.price, product.compareAtPrice);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.3) }}
    >
      <Link to={`/produto/${product.id}`} className="group block">
        <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-muted">
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
          />
          <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
            {product.isNew && (
              <span className="rounded-full bg-white px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider shadow-sm">Novidade</span>
            )}
            {off > 0 && <span className="rounded-full bg-wine px-2 py-0.5 text-[8px] font-bold text-white">-{off}%</span>}
          </div>
        </div>
        <div className="mt-2.5 px-0.5">
          <h3 className="font-sans text-[11px] font-medium tracking-normal">{product.name}</h3>
          <p className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-[11px] font-bold text-wine">{formatBRL(product.price)}</span>
            {product.compareAtPrice ? (
              <span className="text-[9px] text-muted-foreground line-through">{formatBRL(product.compareAtPrice)}</span>
            ) : null}
          </p>
          <div className="mt-1.5 flex gap-1">
            {product.colors.map((c) => (
              <Swatch key={c.name} hex={c.hex} />
            ))}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-[3/4] w-full" />
      <Skeleton className="mt-3 h-2.5 w-3/4 rounded-full" />
      <Skeleton className="mt-2 h-2.5 w-1/3 rounded-full" />
    </div>
  );
}
