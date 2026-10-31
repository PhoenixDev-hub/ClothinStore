import { PackageSearch } from "lucide-react";
import ProductCard from "./ProductCard";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  products: Product[] | undefined;
  loading: boolean;
  error?: boolean;
  skeletons?: number;
  className?: string;
  emptyText?: string;
  testId?: string;
}

export default function ProductGrid({
  products,
  loading,
  error,
  skeletons = 4,
  className,
  emptyText = "Nenhum produto encontrado.",
  testId = "product-grid",
}: Props) {
  const grid = cn("grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4", className);

  if (loading) {
    return (
      <div className={grid} data-testid={`${testId}-loading`}>
        {Array.from({ length: skeletons }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <div className="aspect-[3/4] animate-pulse rounded-2xl bg-neutral-200/70" />
            <div className="h-3.5 w-3/4 animate-pulse rounded-full bg-neutral-200/70" />
            <div className="h-3.5 w-1/3 animate-pulse rounded-full bg-neutral-200/70" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !products || products.length === 0) {
    return (
      <div
        data-testid={`${testId}-empty`}
        className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center"
      >
        <PackageSearch className="size-10 text-neutral-400" strokeWidth={1.5} />
        <p className="text-sm text-neutral-500">
          {error ? "Não foi possível carregar os produtos agora. Tente novamente em instantes." : emptyText}
        </p>
      </div>
    );
  }

  return (
    <div className={grid} data-testid={testId}>
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} index={i} />
      ))}
    </div>
  );
}
