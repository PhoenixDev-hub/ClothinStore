import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Minus, Plus, RefreshCw, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import { toast } from "sonner";
import SafeImage from "@/components/store/SafeImage";
import ProductGrid from "@/components/store/ProductGrid";
import { apiGet } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { categoryLabel, discountPct, formatBRL } from "@/lib/store";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

const slug = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-");

function ProductView({ product }: { product: Product }) {
  const { add, setOpen } = useCart();
  const [active, setActive] = useState(0);
  const [size, setSize] = useState(product.sizes.length === 1 ? product.sizes[0] : "");
  const [color, setColor] = useState(product.colors.length === 1 ? product.colors[0].name : "");
  const [qty, setQty] = useState(1);
  const [missing, setMissing] = useState(false);
  const off = discountPct(product.price, product.compare_at_price);
  const soldOut = product.stock <= 0;
  const images = product.images.length ? product.images : [""];

  const related = useQuery({
    queryKey: ["products", "related", product.category],
    queryFn: () => apiGet<Product[]>(`/products?category=${product.category}&limit=5`),
  });

  const needSize = product.sizes.length > 0 && !size;
  const needColor = product.colors.length > 0 && !color;

  const handleAdd = () => {
    if (needSize || needColor) {
      setMissing(true);
      toast.error(needSize ? "Escolha um tamanho" : "Escolha uma cor");
      return;
    }
    add(product, size || "Único", color || "Única", qty);
    toast.success(`${product.name} adicionado à sacola`);
    setOpen(true);
  };

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-14">
        {/* GALERIA */}
        <div className="lg:col-span-7">
          <div className="flex flex-col-reverse gap-3 md:flex-row">
            <div className="no-scrollbar flex gap-2.5 overflow-x-auto md:w-20 md:flex-col md:overflow-visible">
              {images.map((src, i) => (
                <button
                  key={`${src}-${i}`}
                  type="button"
                  onClick={() => setActive(i)}
                  data-testid={`product-thumb-${i}`}
                  aria-label={`Foto ${i + 1}`}
                  className={cn(
                    "shrink-0 overflow-hidden rounded-xl ring-2 ring-offset-2 transition-[box-shadow,opacity] duration-200",
                    active === i ? "ring-wine" : "opacity-60 ring-transparent hover:opacity-100",
                  )}
                >
                  <SafeImage src={src} alt="" className="aspect-[3/4] w-16 md:w-20" />
                </button>
              ))}
            </div>
            <div className="relative flex-1 overflow-hidden rounded-[24px] bg-neutral-100">
              <SafeImage
                key={active}
                src={images[active]}
                alt={product.name}
                loading="eager"
                testId="product-main-image"
                className="aspect-[3/4] w-full animate-in fade-in duration-500"
              />
              {off > 0 && (
                <span className="absolute left-4 top-4 rounded-full bg-wine px-3 py-1.5 text-xs font-bold text-white">
                  -{off}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* BUY BOX */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-32">
            <div className="flex flex-wrap gap-2">
              <Link
                to={`/produtos?category=${product.category}`}
                className="rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-600 hover:bg-neutral-200"
                data-testid="product-category-link"
              >
                {categoryLabel(product.category)}
              </Link>
              {product.is_new && (
                <span className="rounded-full bg-wine-subtle px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-wine">
                  Novidade
                </span>
              )}
              {product.is_bestseller && (
                <span className="rounded-full bg-ink px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
                  Mais vendido
                </span>
              )}
            </div>
            <h1 className="mt-4 font-heading text-3xl font-bold leading-tight tracking-tight md:text-4xl" data-testid="product-name">
              {product.name}
            </h1>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="font-heading text-3xl font-bold text-wine" data-testid="product-price">
                {formatBRL(product.price)}
              </span>
              {off > 0 && (
                <span className="text-base text-neutral-400 line-through">{formatBRL(product.compare_at_price ?? 0)}</span>
              )}
            </div>

            {product.colors.length > 0 && (
              <div className="mt-8">
                <p className="text-sm font-semibold">
                  Cor: <span className="font-normal text-neutral-600" data-testid="product-selected-color">{color || "selecione"}</span>
                </p>
                <div className={cn("mt-3 flex flex-wrap gap-3 rounded-2xl", missing && needColor && "ring-2 ring-red-300 ring-offset-4")}>
                  {product.colors.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      title={c.name}
                      aria-label={c.name}
                      aria-pressed={color === c.name}
                      onClick={() => setColor(c.name)}
                      data-testid={`product-color-${slug(c.name)}`}
                      className={cn(
                        "size-10 rounded-full ring-1 ring-black/15 transition-[box-shadow,transform] duration-200 hover:scale-105",
                        color === c.name && "ring-2 ring-wine ring-offset-[3px]",
                      )}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>
            )}

            {product.sizes.length > 0 && (
              <div className="mt-7">
                <p className="text-sm font-semibold">
                  Tamanho: <span className="font-normal text-neutral-600" data-testid="product-selected-size">{size || "selecione"}</span>
                </p>
                <div className={cn("mt-3 flex flex-wrap gap-2.5 rounded-2xl", missing && needSize && "ring-2 ring-red-300 ring-offset-4")}>
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={size === s}
                      onClick={() => setSize(s)}
                      data-testid={`product-size-${slug(s)}`}
                      className={cn(
                        "h-11 min-w-12 rounded-full border px-4 text-sm font-semibold transition-colors duration-200",
                        size === s ? "border-ink bg-ink text-white" : "border-neutral-300 bg-white hover:border-ink",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 flex items-center gap-3">
              <div className="flex h-12 items-center rounded-full border border-neutral-300 bg-white">
                <button
                  type="button"
                  aria-label="Diminuir"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  data-testid="product-qty-decrease"
                  className="flex size-12 items-center justify-center rounded-full hover:bg-neutral-100"
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-6 text-center font-semibold" data-testid="product-qty">
                  {qty}
                </span>
                <button
                  type="button"
                  aria-label="Aumentar"
                  onClick={() => setQty((q) => Math.min(Math.max(product.stock, 1), q + 1))}
                  data-testid="product-qty-increase"
                  className="flex size-12 items-center justify-center rounded-full hover:bg-neutral-100"
                >
                  <Plus className="size-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={handleAdd}
                disabled={soldOut}
                data-testid="product-add-to-cart-button"
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-wine text-[15px] font-semibold text-white shadow-lg shadow-wine/20 transition-[background-color,transform] duration-200 hover:bg-wine-hover active:scale-[0.98] disabled:bg-neutral-300 disabled:shadow-none"
              >
                <ShoppingBag className="size-4" />
                {soldOut ? "Esgotado" : "Adicionar ao carrinho"}
              </button>
            </div>
            {!soldOut && product.stock <= 5 && (
              <p className="mt-3 text-xs font-semibold text-wine" data-testid="product-low-stock">
                Últimas {product.stock} unidades!
              </p>
            )}

            {product.description && (
              <div className="mt-8 border-t border-neutral-200 pt-6">
                <p className="text-sm font-semibold">Descrição</p>
                <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-neutral-600" data-testid="product-description">
                  {product.description}
                </p>
              </div>
            )}

            <div className="mt-6 grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-neutral-200/80">
              {[
                { icon: Truck, t: "Envio para todo o Brasil ou retirada na loja" },
                { icon: RefreshCw, t: "Primeira troca grátis em até 7 dias" },
                { icon: ShieldCheck, t: "Pedido confirmado pelo WhatsApp" },
              ].map((b) => (
                <div key={b.t} className="flex items-center gap-3 text-sm text-neutral-700">
                  <b.icon className="size-4 shrink-0 text-wine" /> {b.t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {related.data && related.data.filter((p) => p.id !== product.id).length > 0 && (
        <section className="mt-20">
          <h2 className="mb-7 font-heading text-2xl font-bold tracking-tight md:text-3xl">Você também vai amar</h2>
          <ProductGrid
            products={related.data.filter((p) => p.id !== product.id).slice(0, 4)}
            loading={false}
            testId="related-grid"
          />
        </section>
      )}
    </>
  );
}

export default function ProductDetail() {
  const { id = "" } = useParams();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["products", "detail", id],
    queryFn: () => apiGet<Product>(`/products/${id}`),
    retry: false,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 pb-8 pt-6 md:px-8 md:pt-8" data-testid="product-page">
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-neutral-500" aria-label="breadcrumb">
        <Link to="/" className="hover:text-ink">
          Início
        </Link>
        <ChevronRight className="size-3" />
        <Link to="/produtos" className="hover:text-ink" data-testid="breadcrumb-products">
          Produtos
        </Link>
        {data && !isError && (
          <>
            <ChevronRight className="size-3" />
            <span className="line-clamp-1 font-medium text-ink">{data.name}</span>
          </>
        )}
      </nav>
      {isLoading ? (
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="aspect-[3/4] animate-pulse rounded-[24px] bg-neutral-200/70 lg:col-span-7" />
          <div className="space-y-4 lg:col-span-5">
            <div className="h-8 w-3/4 animate-pulse rounded-full bg-neutral-200/70" />
            <div className="h-8 w-1/3 animate-pulse rounded-full bg-neutral-200/70" />
          </div>
        </div>
      ) : isError || !data ? (
        <div className="rounded-3xl border border-dashed border-neutral-300 bg-white px-6 py-20 text-center" data-testid="product-not-found">
          <p className="font-heading text-2xl font-bold">Produto não encontrado</p>
          <p className="mt-2 text-sm text-neutral-500">Ele pode ter saído do catálogo.</p>
          <Link to="/produtos" className="mt-6 inline-flex rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white">
            Ver produtos
          </Link>
        </div>
      ) : (
        <ProductView key={data.id} product={data} />
      )}
    </div>
  );
}
