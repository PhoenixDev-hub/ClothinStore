import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { ChevronLeft, ChevronRight, PackageSearch, SlidersHorizontal, WifiOff, X } from "lucide-react";
import { useCategories, useProducts } from "@/hooks/queries";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { productQueryFromParams } from "@/lib/api";
import { cn, formatBRL, parseBRLToCents, SIZE_OPTIONS } from "@/lib/utils";

const PAGE_SIZE = 12;

export default function Products() {
  const [params, setParams] = useSearchParams();
  const [sheetOpen, setSheetOpen] = useState(false);
  const categories = useCategories();

  const query = useMemo(() => {
    const parsed = productQueryFromParams(params);
    return { ...parsed, limit: PAGE_SIZE, page: parsed.page ?? 1 };
  }, [params]);

  const products = useProducts(query, true);
  const data = products.data;
  const page = data?.meta.page ?? query.page ?? 1;
  const totalPages = data?.meta.totalPages ?? 1;

  const patch = (changes: Record<string, string | number | null | undefined>) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") next.delete(key);
      else next.set(key, String(value));
    });
    setParams(next);
  };

  const category = params.get("category") ?? "";
  const size = params.get("size") ?? "";
  const color = params.get("color") ?? "";
  const search = params.get("q") ?? "";
  const minCents = parseBRLToCents(params.get("min") ?? "");
  const maxCents = parseBRLToCents(params.get("max") ?? "");

  const colorOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const product of data?.data ?? []) {
      for (const variant of product.variants) map.set(variant.color, variant.colorHex ?? "#d4d4d4");
    }
    if (color) map.set(color, map.get(color) ?? "#d4d4d4");
    return [...map];
  }, [data, color]);

  const activeCount = [category, size, color, search, params.get("min"), params.get("max")].filter(Boolean).length;

  const clearAll = () => setParams(new URLSearchParams());

  const filters = (
    <div className="space-y-7">
      <div>
        <p className="mb-3 text-sm font-semibold text-muted-foreground">Categoria</p>
        <ul className="space-y-2">
          {(categories.data ?? []).map((c) => (
            <li key={c.slug}>
              <button
                type="button"
                onClick={() => patch({ category: category === c.slug ? null : c.slug, page: null })}
                aria-pressed={category === c.slug}
                className={cn(
                  "flex min-h-11 w-full items-center justify-between gap-3 rounded-full border px-4 text-left text-sm transition-colors duration-200",
                  category === c.slug ? "border-ink bg-ink text-white" : "border-border bg-white hover:border-ink",
                )}
              >
                <span>{c.name}</span>
                <span className={cn("text-sm", category === c.slug ? "text-white/80" : "text-muted-foreground")}>
                  {c._count?.products ?? 0}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-border pt-6">
        <p className="mb-3 text-sm font-semibold text-muted-foreground">Tamanho</p>
        <div className="flex flex-wrap gap-2">
          {SIZE_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => patch({ size: size === s ? null : s, page: null })}
              aria-pressed={size === s}
              className={cn(
                "grid size-11 place-items-center rounded-full border text-sm font-medium transition-colors duration-200",
                size === s ? "border-ink bg-ink text-white" : "border-border bg-white hover:border-ink",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {colorOptions.length > 0 && (
        <div className="border-t border-border pt-6">
          <p className="mb-2 text-sm font-semibold text-muted-foreground">Cor</p>
          <div className="grid grid-cols-2 gap-1">
            {colorOptions.map(([name, hex]) => (
              <button
                key={name}
                type="button"
                onClick={() => patch({ color: color === name ? null : name, page: null })}
                aria-pressed={color === name}
                className={cn(
                  "flex min-h-11 items-center gap-2.5 rounded-full px-2 text-left text-sm transition-colors duration-200",
                  color === name ? "font-semibold text-wine" : "hover:bg-muted",
                )}
              >
                <span className={cn("grid size-6 place-items-center rounded-full ring-offset-2", color === name && "ring-2 ring-wine")}>
                  <span className="size-6 rounded-full ring-1 ring-black/15" style={{ background: hex }} />
                </span>
                <span className="truncate">{name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-border pt-6">
        <p className="mb-3 text-sm font-semibold text-muted-foreground">Faixa de preço</p>
        <form
          key={`${params.get("min") ?? ""}-${params.get("max") ?? ""}`}
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            const min = parseBRLToCents(String(form.get("min") ?? ""));
            const max = parseBRLToCents(String(form.get("max") ?? ""));
            patch({ min: min ?? null, max: max ?? null, page: null });
          }}
        >
          <Input name="min" inputMode="decimal" placeholder="Min" defaultValue={params.get("min") ?? ""} className="h-11 rounded-full px-4 text-sm" />
          <span className="text-muted-foreground">–</span>
          <Input name="max" inputMode="decimal" placeholder="Máx" defaultValue={params.get("max") ?? ""} className="h-11 rounded-full px-4 text-sm" />
          <Button type="submit" variant="dark" className="px-4">
            OK
          </Button>
        </form>
        {minCents !== undefined && maxCents !== undefined && (
          <p className="mt-2 text-sm text-muted-foreground">
            De {formatBRL(minCents)} até {formatBRL(maxCents)}
          </p>
        )}
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
        <span className="inline-flex min-h-11 items-center px-1 font-medium text-foreground">Produtos</span>
      </nav>

      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold leading-none sm:text-4xl">
            {category ? categories.data?.find((c) => c.slug === category)?.name ?? "Produtos" : "Todos os produtos"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {products.isLoading ? "Carregando..." : `${data?.meta.total ?? 0} ${(data?.meta.total ?? 0) === 1 ? "produto" : "produtos"}`}
          </p>
        </div>
        <Button variant="outline" className="lg:hidden" onClick={() => setSheetOpen(true)}>
          <SlidersHorizontal /> Filtrar{activeCount > 0 ? ` (${activeCount})` : ""}
        </Button>
      </div>

      {activeCount > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {search && (
            <button
              type="button"
              onClick={() => patch({ q: null, page: null })}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-wine-soft px-4 text-sm font-semibold text-wine"
              aria-label={`Remover busca ${search}`}
            >
              “{search}” <X className="size-4" />
            </button>
          )}
          {category && (
            <button
              type="button"
              onClick={() => patch({ category: null, page: null })}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-wine-soft px-4 text-sm font-semibold text-wine"
            >
              {categories.data?.find((c) => c.slug === category)?.name ?? category} <X className="size-4" />
            </button>
          )}
          {size && (
            <button
              type="button"
              onClick={() => patch({ size: null, page: null })}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-wine-soft px-4 text-sm font-semibold text-wine"
            >
              Tam. {size} <X className="size-4" />
            </button>
          )}
          {color && (
            <button
              type="button"
              onClick={() => patch({ color: null, page: null })}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-wine-soft px-4 text-sm font-semibold text-wine"
            >
              {color} <X className="size-4" />
            </button>
          )}
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm font-semibold transition-colors duration-200 hover:border-ink"
          >
            Limpar tudo
          </button>
        </div>
      )}

      <div className="mt-7 grid gap-8 lg:grid-cols-[220px_1fr] lg:gap-8">
        <aside className="hidden lg:block" aria-label="Filtros">
          <div className="mb-4 flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-bold">Filtrar</h2>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex min-h-11 items-center text-sm font-medium text-wine underline-offset-4 hover:underline"
              >
                Limpar ({activeCount})
              </button>
            )}
          </div>
          {filters}
        </aside>

        <section aria-busy={products.isFetching}>
          {products.isError ? (
            <div className="grid place-items-center rounded-3xl border border-dashed border-border bg-white px-6 py-24 text-center">
              <div>
                <span className="mx-auto grid size-14 place-items-center rounded-full bg-wine-soft text-wine">
                  <WifiOff className="size-6" />
                </span>
                <p className="mt-4 font-display text-lg font-semibold">Não foi possível carregar os produtos</p>
                <p className="mt-1 text-sm text-muted-foreground">Verifique a conexão com a loja e tente de novo.</p>
                <Button variant="dark" className="mt-5" onClick={() => products.refetch()}>
                  Tentar novamente
                </Button>
              </div>
            </div>
          ) : !products.isLoading && data?.data.length === 0 ? (
            <div className="grid place-items-center rounded-3xl border border-dashed border-border bg-white px-6 py-24 text-center">
              <div>
                <span className="mx-auto grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">
                  <PackageSearch className="size-6" />
                </span>
                <p className="mt-4 font-display text-lg font-semibold">Nenhum produto encontrado</p>
                <p className="mt-1 text-sm text-muted-foreground">Tente remover alguns filtros.</p>
                <Button onClick={clearAll} variant="dark" className="mt-5">
                  Limpar filtros
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3">
                {products.isLoading
                  ? Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
                  : data?.data.map((p, i) => <ProductCard key={p.id} product={p} priority={i === 0} />)}
              </div>
              {totalPages > 1 && (
                <nav className="mt-10 flex flex-wrap items-center justify-center gap-3" aria-label="Paginação">
                  <Button variant="outline" disabled={page <= 1} onClick={() => patch({ page: page - 1 })}>
                    <ChevronLeft /> Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {page} de {totalPages}
                  </span>
                  <Button variant="outline" disabled={page >= totalPages} onClick={() => patch({ page: page + 1 })}>
                    Próxima <ChevronRight />
                  </Button>
                </nav>
              )}
            </>
          )}
        </section>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className="w-[92%] p-0 sm:max-w-md">
          <SheetHeader className="border-b border-border">
            <SheetTitle className="text-lg font-semibold">Filtrar produtos</SheetTitle>
            <SheetDescription>Escolha categoria, tamanho, cor e preço.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-5 py-5">{filters}</div>
          <div className="border-t border-border p-4">
            <SheetClose asChild>
              <Button className="w-full" size="lg">
                Ver {data?.meta.total ?? 0} produtos
              </Button>
            </SheetClose>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
