import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { AnimatePresence } from "motion/react";
import { ChevronRight, SlidersHorizontal, X } from "lucide-react";
import { useProducts } from "@/hooks/queries";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { Swatch } from "@/components/Swatch";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, FILTER_COLORS, FILTER_SIZES, PRICE_RANGES, SORT_OPTIONS, cn, categoryLabel } from "@/lib/utils";
import type { CategorySlug, ProductQuery, SortKey } from "@/types";

const num = (v: string | null) => (v && !Number.isNaN(Number(v)) ? Number(v) : undefined);
const list = (v: string | null) => (v ? v.split(",").filter(Boolean) : []);

function GroupTitle({ children }: { children: React.ReactNode }) {
  return <h4 className="mb-3 font-sans text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{children}</h4>;
}

export default function Products() {
  const [params, setParams] = useSearchParams();
  const [drawer, setDrawer] = useState(false);

  const category = params.get("category") as CategorySlug | null;
  const tag = params.get("tag") as "new" | "bestseller" | null;
  const sizes = list(params.get("sizes"));
  const colors = list(params.get("colors"));
  const min = num(params.get("min"));
  const max = num(params.get("max"));
  const q = params.get("q") ?? undefined;
  const sort = (params.get("sort") as SortKey) || "recent";

  const query: ProductQuery = useMemo(
    () => ({ category: category ?? undefined, tag: tag ?? undefined, sizes, colors, min, max, q, sort }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [category, tag, params.get("sizes"), params.get("colors"), min, max, q, sort],
  );
  const { data, isLoading, isFetching } = useProducts(query);
  const loading = isLoading || (isFetching && !data);

  const [minDraft, setMinDraft] = useState(params.get("min") ?? "");
  const [maxDraft, setMaxDraft] = useState(params.get("max") ?? "");

  const patch = (changes: Record<string, string | null | undefined>) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: false });
  };

  const toggle = (key: "sizes" | "colors", value: string) => {
    const cur = key === "sizes" ? sizes : colors;
    const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
    patch({ [key]: next.join(",") || null });
  };

  const setRange = (lo?: number, hi?: number) => {
    setMinDraft(lo?.toString() ?? "");
    setMaxDraft(hi?.toString() ?? "");
    patch({ min: lo?.toString(), max: hi?.toString() });
  };

  const clearAll = () => {
    setMinDraft("");
    setMaxDraft("");
    setParams(new URLSearchParams(sort !== "recent" ? { sort } : {}));
  };

  const title = tag === "new" ? "Novidades" : tag === "bestseller" ? "Mais Vendidos" : category ? categoryLabel(category) : q ? `Busca: “${q}”` : "Todos os produtos";

  const chips: { label: string; remove: () => void }[] = [];
  if (tag) chips.push({ label: tag === "new" ? "Novidades" : "Mais vendidos", remove: () => patch({ tag: null }) });
  if (category) chips.push({ label: categoryLabel(category), remove: () => patch({ category: null }) });
  sizes.forEach((s) => chips.push({ label: `Tam. ${s}`, remove: () => toggle("sizes", s) }));
  colors.forEach((c) => chips.push({ label: c, remove: () => toggle("colors", c) }));
  if (min != null || max != null)
    chips.push({
      label: min != null && max != null ? `R$ ${min} – R$ ${max}` : min != null ? `Acima de R$ ${min}` : `Até R$ ${max}`,
      remove: () => setRange(undefined, undefined),
    });
  if (q) chips.push({ label: `“${q}”`, remove: () => patch({ q: null }) });

  const stats = data && data.length ? `Produtos de R$ ${Math.min(...data.map((p) => p.price)).toFixed(2).replace(".", ",")} a R$ ${Math.max(...data.map((p) => p.price)).toFixed(2).replace(".", ",")}` : null;

  const filters = (
    <div className="space-y-6">
      <div>
        <GroupTitle>Categoria</GroupTitle>
        <ul className="space-y-2.5">
          {CATEGORIES.map((c) => (
            <li key={c.slug}>
              <label className="flex cursor-pointer items-center gap-2.5 text-[11px]">
                <Checkbox checked={category === c.slug} onCheckedChange={(v) => patch({ category: v ? c.slug : null })} />
                <span className={cn(category === c.slug && "font-semibold")}>{c.label}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-border pt-6">
        <GroupTitle>Tamanho</GroupTitle>
        <div className="flex flex-wrap gap-1.5">
          {FILTER_SIZES.map((s) => (
            <button
              key={s}
              onClick={() => toggle("sizes", s)}
              className={cn(
                "grid h-7 min-w-7 place-items-center rounded-full border px-2.5 text-[10px] font-medium transition",
                sizes.includes(s) ? "border-ink bg-ink text-white" : "border-border bg-white hover:border-ink",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <GroupTitle>Cor</GroupTitle>
        <div className="grid grid-cols-2 gap-x-1 gap-y-2.5 whitespace-nowrap">
          {FILTER_COLORS.map((c) => (
            <button key={c.name} onClick={() => toggle("colors", c.name)} className={cn("flex items-center gap-2 text-left text-[11px]", colors.includes(c.name) && "font-semibold text-wine")}>
              <span className={cn("grid size-4 place-items-center rounded-full ring-offset-2 transition", colors.includes(c.name) && "ring-2 ring-wine")}>
                <Swatch hex={c.hex} className="size-4" />
              </span>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <GroupTitle>Faixa de preço</GroupTitle>
        <ul className="space-y-2.5">
          {PRICE_RANGES.map((r) => {
            const active = min === r.min && max === r.max;
            return (
              <li key={r.label}>
                <label className="flex cursor-pointer items-center gap-2.5 text-[11px]">
                  <Checkbox checked={active} onCheckedChange={(v) => (v ? setRange(r.min, r.max) : setRange())} />
                  {r.label}
                </label>
              </li>
            );
          })}
        </ul>
        <form
          className="mt-3 flex items-center gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            setRange(num(minDraft), num(maxDraft));
          }}
        >
          <Input inputMode="decimal" placeholder="Min" value={minDraft} onChange={(e) => setMinDraft(e.target.value)} className="h-8 rounded-full px-3 text-[10px]" />
          <span className="text-muted-foreground">–</span>
          <Input inputMode="decimal" placeholder="Máx" value={maxDraft} onChange={(e) => setMaxDraft(e.target.value)} className="h-8 rounded-full px-3 text-[10px]" />
          <Button type="submit" variant="dark" size="sm" className="h-8 px-3.5">
            OK
          </Button>
        </form>
        {stats && <p className="mt-2 text-[9px] text-muted-foreground">{stats}</p>}
      </div>
    </div>
  );

  return (
    <div className="container-shop pb-6 pt-6">
      <nav className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Início</Link>
        <ChevronRight className="size-3" />
        <span className="font-medium text-foreground">{title}</span>
      </nav>

      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[34px] font-bold leading-none sm:text-[38px]">{title}</h1>
          <p className="mt-1.5 text-[10px] text-muted-foreground">
            {loading ? "Carregando..." : `${data?.length ?? 0} ${(data?.length ?? 0) === 1 ? "produto" : "produtos"}`}
          </p>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 lg:hidden" onClick={() => setDrawer(true)}>
            <SlidersHorizontal /> Filtrar
          </Button>
          <Select value={sort} onValueChange={(v) => patch({ sort: v === "recent" ? null : v })}>
            <SelectTrigger className="w-[140px]" aria-label="Ordenar">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {chips.map((c) => (
            <button key={c.label} onClick={c.remove} className="flex items-center gap-1.5 rounded-full bg-wine-soft px-3 py-1 text-[9px] font-semibold text-wine transition hover:bg-wine hover:text-white">
              {c.label} <X className="size-2.5" />
            </button>
          ))}
        </div>
      )}

      <div className="mt-7 grid gap-8 lg:grid-cols-[165px_1fr] lg:gap-[27px]">
        <aside className="hidden lg:block">
          <div className="mb-5 flex items-baseline justify-between">
            <h3 className="font-sans text-[11px] font-bold">Filtrar</h3>
            {chips.length > 0 && (
              <button onClick={clearAll} className="text-[9px] font-medium text-wine hover:underline">
                Limpar ({chips.length})
              </button>
            )}
          </div>
          {filters}
        </aside>

        <section>
          {!loading && data?.length === 0 ? (
            <div className="grid place-items-center rounded-3xl border border-dashed border-border py-24 text-center">
              <div>
                <p className="font-display text-lg font-semibold">Nenhum produto encontrado</p>
                <p className="mt-1 text-xs text-muted-foreground">Tente remover alguns filtros.</p>
                <Button onClick={clearAll} variant="dark" size="sm" className="mt-4">
                  Limpar filtros
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
              ) : (
                <AnimatePresence mode="popLayout">
                  {data?.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
                </AnimatePresence>
              )}
            </div>
          )}
        </section>
      </div>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 w-[85%] max-w-xs overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">Filtrar</h3>
              <button onClick={() => setDrawer(false)} aria-label="Fechar">
                <X className="size-5" />
              </button>
            </div>
            {filters}
            <Button className="mt-8 w-full" onClick={() => setDrawer(false)}>
              Ver {data?.length ?? 0} produtos
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
