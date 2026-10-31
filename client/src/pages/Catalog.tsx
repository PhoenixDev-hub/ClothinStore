import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, SlidersHorizontal, X } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FilterPanel from "@/components/store/FilterPanel";
import type { Filters } from "@/components/store/FilterPanel";
import ProductGrid from "@/components/store/ProductGrid";
import { apiGet } from "@/lib/api";
import { categoryLabel } from "@/lib/store";
import type { Product, ProductFacets } from "@/lib/types";

const SORTS: Record<string, string> = {
  recent: "Mais recentes",
  price_asc: "Menor preço",
  price_desc: "Maior preço",
  name: "Nome (A-Z)",
};

const list = (v: string | null) => (v ? v.split(",").filter(Boolean) : []);

export default function Catalog() {
  const [params, setParams] = useSearchParams();
  const [sheetOpen, setSheetOpen] = useState(false);

  const filters: Filters = {
    category: list(params.get("category")),
    sizes: list(params.get("sizes")),
    colors: list(params.get("colors")),
    min: params.get("min") ?? "",
    max: params.get("max") ?? "",
  };
  const q = params.get("q") ?? "";
  const tag = params.get("tag") ?? "";
  const sort = params.get("sort") ?? "recent";

  const apiQuery = useMemo(() => {
    const s = new URLSearchParams();
    if (filters.category.length) s.set("category", filters.category.join(","));
    if (filters.sizes.length) s.set("sizes", filters.sizes.join(","));
    if (filters.colors.length) s.set("colors", filters.colors.join(","));
    if (filters.min && !Number.isNaN(Number(filters.min))) s.set("min_price", filters.min);
    if (filters.max && !Number.isNaN(Number(filters.max))) s.set("max_price", filters.max);
    if (q) s.set("q", q);
    if (tag) s.set("tag", tag);
    s.set("sort", sort);
    return s.toString();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const products = useQuery({
    queryKey: ["products", "catalog", apiQuery],
    queryFn: () => apiGet<Product[]>(`/products?${apiQuery}`),
  });
  const facets = useQuery({
    queryKey: ["products", "facets"],
    queryFn: () => apiGet<ProductFacets>("/products/facets"),
  });

  const update = (next: Partial<Filters & { sort: string; q: string; tag: string }>) => {
    const p = new URLSearchParams(params);
    Object.entries(next).forEach(([k, v]) => {
      const val = Array.isArray(v) ? v.join(",") : v;
      if (val) p.set(k, val);
      else p.delete(k);
    });
    setParams(p, { replace: true });
  };

  const clearAll = () => {
    const p = new URLSearchParams();
    if (sort !== "recent") p.set("sort", sort);
    setParams(p, { replace: true });
  };

  const title = q
    ? `Busca: “${q}”`
    : tag === "new"
      ? "Novidades"
      : tag === "bestseller"
        ? "Mais Vendidos"
        : filters.category.length === 1
          ? categoryLabel(filters.category[0])
          : "Todos os produtos";

  const chips: { label: string; clear: () => void; id: string }[] = [
    ...(tag ? [{ id: "tag", label: tag === "new" ? "Novidades" : "Mais vendidos", clear: () => update({ tag: "" }) }] : []),
    ...(q ? [{ id: "q", label: `“${q}”`, clear: () => update({ q: "" }) }] : []),
    ...filters.category.map((c) => ({
      id: `cat-${c}`,
      label: categoryLabel(c),
      clear: () => update({ category: filters.category.filter((x) => x !== c) }),
    })),
    ...filters.sizes.map((s) => ({
      id: `size-${s}`,
      label: `Tam. ${s}`,
      clear: () => update({ sizes: filters.sizes.filter((x) => x !== s) }),
    })),
    ...filters.colors.map((c) => ({
      id: `color-${c}`,
      label: c,
      clear: () => update({ colors: filters.colors.filter((x) => x !== c) }),
    })),
    ...(filters.min || filters.max
      ? [
          {
            id: "price",
            label: `R$ ${filters.min || "0"} – ${filters.max ? `R$ ${filters.max}` : "+"}`,
            clear: () => update({ min: "", max: "" }),
          },
        ]
      : []),
  ];

  const panel = (prefix: string) => (
    <FilterPanel
      key={`${prefix}-${filters.min}-${filters.max}`}
      filters={filters}
      facets={facets.data}
      onChange={update}
      onClear={clearAll}
      idPrefix={prefix}
    />
  );

  return (
    <div className="mx-auto max-w-7xl px-4 pb-8 pt-6 md:px-8 md:pt-10" data-testid="catalog-page">
      <nav className="flex items-center gap-1.5 text-xs text-neutral-500" aria-label="breadcrumb">
        <Link to="/" className="hover:text-ink" data-testid="breadcrumb-home">
          Início
        </Link>
        <ChevronRight className="size-3" />
        <span className="font-medium text-ink">{title}</span>
      </nav>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight md:text-5xl" data-testid="catalog-title">
            {title}
          </h1>
          <p className="mt-1.5 text-sm text-neutral-500" data-testid="catalog-count">
            {products.isLoading
              ? "Carregando…"
              : `${products.data?.length ?? 0} ${products.data?.length === 1 ? "produto" : "produtos"}`}
          </p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            data-testid="catalog-mobile-filter-button"
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white px-4 text-sm font-semibold transition-colors duration-200 hover:border-ink lg:hidden"
          >
            <SlidersHorizontal className="size-4" /> Filtros
            {chips.length > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full bg-wine text-[10px] text-white">
                {chips.length}
              </span>
            )}
          </button>
          <Select value={sort} onValueChange={(v: string) => update({ sort: v === "recent" ? "" : v })}>
            <SelectTrigger
              className="h-10 flex-1 rounded-full border-neutral-300 bg-white px-4 text-sm sm:w-48 sm:flex-none"
              data-testid="catalog-sort-select"
            >
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SORTS).map(([k, label]) => (
                <SelectItem key={k} value={k} data-testid={`catalog-sort-${k}`}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2" data-testid="active-filter-chips">
          {chips.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={c.clear}
              data-testid={`active-chip-${c.id}`}
              className="flex items-center gap-1.5 rounded-full bg-wine-subtle px-3 py-1.5 text-xs font-semibold text-wine transition-colors duration-200 hover:bg-wine hover:text-white"
            >
              {c.label} <X className="size-3" />
            </button>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[250px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-32">{panel("filter")}</div>
        </aside>
        <ProductGrid
          products={products.data}
          loading={products.isLoading}
          error={products.isError}
          skeletons={6}
          className="lg:grid-cols-3"
          emptyText="Nenhum produto com esses filtros. Tente remover algum filtro."
          testId="catalog-grid"
        />
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className="gap-0 p-0 data-[side=left]:w-[88%]" data-testid="mobile-filter-sheet">
          <SheetTitle className="sr-only">Filtros</SheetTitle>
          <div className="flex-1 overflow-y-auto px-5 pb-6 pt-6">{panel("mobile-filter")}</div>
          <div className="border-t border-neutral-100 p-4">
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              data-testid="mobile-filter-apply"
              className="h-12 w-full rounded-full bg-wine text-[15px] font-semibold text-white transition-[background-color,transform] duration-200 hover:bg-wine-hover active:scale-[0.98]"
            >
              Ver {products.data?.length ?? 0} produtos
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
