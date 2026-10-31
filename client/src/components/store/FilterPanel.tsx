import { useState } from "react";
import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { CATEGORIES, formatBRL } from "@/lib/store";
import type { ProductFacets } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface Filters {
  category: string[];
  sizes: string[];
  colors: string[];
  min: string;
  max: string;
}

interface Props {
  filters: Filters;
  facets: ProductFacets | undefined;
  onChange: (next: Partial<Filters>) => void;
  onClear: () => void;
  idPrefix?: string;
}

const PRICE_PRESETS = [
  { label: "Até R$ 50", min: "", max: "50" },
  { label: "R$ 50 a R$ 100", min: "50", max: "100" },
  { label: "R$ 100 a R$ 150", min: "100", max: "150" },
  { label: "Acima de R$ 150", min: "150", max: "" },
];

const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
const slug = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-");

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-b border-neutral-200/80 py-5 first:pt-0">
      <p className="mb-3.5 text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500">{title}</p>
      {children}
    </div>
  );
}

export default function FilterPanel({ filters, facets, onChange, onClear, idPrefix = "filter" }: Props) {
  const [min, setMin] = useState(filters.min);
  const [max, setMax] = useState(filters.max);
  const active =
    filters.category.length + filters.sizes.length + filters.colors.length + (filters.min || filters.max ? 1 : 0);

  return (
    <div data-testid={`${idPrefix}-panel`}>
      <div className="mb-5 flex items-center justify-between">
        <p className="font-heading text-lg font-bold">Filtrar</p>
        {active > 0 && (
          <button
            type="button"
            onClick={() => {
              setMin("");
              setMax("");
              onClear();
            }}
            data-testid={`${idPrefix}-clear-button`}
            className="text-xs font-semibold text-wine underline-offset-4 hover:underline"
          >
            Limpar ({active})
          </button>
        )}
      </div>

      <Section title="Categoria">
        <div className="flex flex-col gap-1">
          {CATEGORIES.map((c) => {
            const on = filters.category.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onChange({ category: toggle(filters.category, c.id) })}
                data-testid={`${idPrefix}-category-${c.id}`}
                aria-pressed={on}
                className="group flex items-center gap-3 rounded-lg py-1.5 text-left text-sm"
              >
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-md border transition-colors duration-200",
                    on ? "border-wine bg-wine text-white" : "border-neutral-300 group-hover:border-wine",
                  )}
                >
                  {on && <Check className="size-3.5" strokeWidth={3} />}
                </span>
                <span className={cn(on ? "font-semibold text-ink" : "text-neutral-700")}>{c.label}</span>
              </button>
            );
          })}
        </div>
      </Section>

      {facets && facets.sizes.length > 0 && (
        <Section title="Tamanho">
          <div className="flex flex-wrap gap-2">
            {facets.sizes.map((s) => {
              const on = filters.sizes.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => onChange({ sizes: toggle(filters.sizes, s) })}
                  data-testid={`${idPrefix}-size-${slug(s)}`}
                  aria-pressed={on}
                  className={cn(
                    "h-9 min-w-11 rounded-full border px-3 text-xs font-semibold transition-colors duration-200",
                    on ? "border-ink bg-ink text-white" : "border-neutral-300 bg-white hover:border-ink",
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </Section>
      )}

      {facets && facets.colors.length > 0 && (
        <Section title="Cor">
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            {facets.colors.map((c) => {
              const on = filters.colors.includes(c.name);
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => onChange({ colors: toggle(filters.colors, c.name) })}
                  data-testid={`${idPrefix}-color-${slug(c.name)}`}
                  aria-pressed={on}
                  className="flex items-center gap-2.5 rounded-lg py-1.5 text-left text-sm"
                >
                  <span
                    className={cn(
                      "size-5 shrink-0 rounded-full ring-1 ring-black/15 transition-shadow duration-200",
                      on && "ring-2 ring-wine ring-offset-2",
                    )}
                    style={{ backgroundColor: c.hex }}
                  />
                  <span className={cn("truncate", on ? "font-semibold text-ink" : "text-neutral-700")}>{c.name}</span>
                </button>
              );
            })}
          </div>
        </Section>
      )}

      <Section title="Faixa de preço">
        <div className="flex flex-col gap-1.5">
          {PRICE_PRESETS.map((p, i) => {
            const on = filters.min === p.min && filters.max === p.max;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  const next = on ? { min: "", max: "" } : { min: p.min, max: p.max };
                  setMin(next.min);
                  setMax(next.max);
                  onChange(next);
                }}
                data-testid={`${idPrefix}-price-preset-${i}`}
                aria-pressed={on}
                className="flex items-center gap-3 py-1 text-left text-sm"
              >
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full border transition-colors duration-200",
                    on ? "border-wine" : "border-neutral-300",
                  )}
                >
                  {on && <span className="size-2.5 rounded-full bg-wine" />}
                </span>
                <span className={cn(on ? "font-semibold" : "text-neutral-700")}>{p.label}</span>
              </button>
            );
          })}
        </div>
        <form
          className="mt-4 flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            onChange({ min: min.replace(",", "."), max: max.replace(",", ".") });
          }}
        >
          <input
            inputMode="decimal"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            placeholder={facets ? `Mín ${Math.floor(facets.min_price)}` : "Mín"}
            data-testid={`${idPrefix}-price-min`}
            className="h-9 w-full min-w-0 rounded-full border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-wine"
          />
          <span className="text-neutral-400">–</span>
          <input
            inputMode="decimal"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            placeholder={facets ? `Máx ${Math.ceil(facets.max_price)}` : "Máx"}
            data-testid={`${idPrefix}-price-max`}
            className="h-9 w-full min-w-0 rounded-full border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-wine"
          />
          <button
            type="submit"
            data-testid={`${idPrefix}-price-apply`}
            className="h-9 shrink-0 rounded-full bg-ink px-3.5 text-xs font-semibold text-white transition-colors duration-200 hover:bg-wine"
          >
            OK
          </button>
        </form>
        {facets && (
          <p className="mt-2 text-[11px] text-neutral-400">
            Produtos de {formatBRL(facets.min_price)} a {formatBRL(facets.max_price)}
          </p>
        )}
      </Section>
    </div>
  );
}
