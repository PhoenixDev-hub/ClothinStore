import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProduct, useProducts } from "@/hooks/queries";
import { isSoldOut } from "@/lib/product";
import { cn, discountPercent, formatBRL } from "@/lib/utils";
import { useCart } from "@/store/cart";
import type { Variant } from "@/types";
import { ChevronRight, Minus, Plus, RefreshCw, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";

function Loading() {
  return (
    <div className="container-shop pt-5">
      <Skeleton className="h-4 w-40 rounded-full" />
      <div className="mt-4 grid gap-8 md:grid-cols-[1.2fr_1fr]">
        <Skeleton className="aspect-[4/5] w-full" />
        <div className="space-y-4">
          <Skeleton className="h-6 w-64 rounded-full" />
          <Skeleton className="h-6 w-32 rounded-full" />
        </div>
      </div>
    </div>
  );
}

const unique = (values: string[]) => [...new Set(values)];

export default function ProductDetail() {
  const { slug } = useParams();
  const { data: product, isLoading, isError, refetch } = useProduct(slug);
  const { data: relatedData } = useProducts(
    product ? { category: product.category.slug, limit: 4 } : {},
    false,
    Boolean(product),
  );
  const add = useCart((s) => s.add);

  const [image, setImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>();
  const [selectedColor, setSelectedColor] = useState<string>();
  const [qty, setQty] = useState(1);

  if (isLoading) return <Loading />;
  if (isError || !product)
    return (
      <div className="container-shop grid place-items-center py-32 text-center">
        <div>
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">
            <ShoppingBag className="size-6" />
          </span>
          <h1 className="mt-4 text-2xl font-bold">Produto não encontrado</h1>
          <p className="mt-2 text-sm text-muted-foreground">Esse item pode ter saído do catálogo.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button variant="outline" onClick={() => refetch()}>
              Tentar novamente
            </Button>
            <Button asChild>
              <Link to="/produtos">Ver todos os produtos</Link>
            </Button>
          </div>
        </div>
      </div>
    );

  const sellable = product.variants.filter((v) => v.available && v.stock > 0);
  const sizes = unique(sellable.map((v) => v.size));
  const size = sizes.includes(selectedSize ?? "") ? selectedSize : sizes.length === 1 ? sizes[0] : undefined;
  const colors = unique(sellable.filter((v) => v.size === size).map((v) => v.color));
  const color = colors.includes(selectedColor ?? "") ? selectedColor : colors.length === 1 ? colors[0] : undefined;
  const variant: Variant | undefined = sellable.find((v) => v.size === size && v.color === color);
  const soldOut = isSoldOut(product);
  const off = discountPercent(product.price, product.compareAtPrice);
  const maxQty = variant?.stock ?? 1;
  const currentImage = product.images[image] ?? product.images[0];
  const more = (relatedData?.data ?? []).filter((p) => p.id !== product.id).slice(0, 4);

  const submit = () => {
    if (!variant) {
      toast.error("Selecione o tamanho e a cor disponíveis");
      return;
    }
    add({
      sku: variant.sku,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images[0] ?? "",
      unitPrice: variant.price ?? product.price,
      size: variant.size,
      color: variant.color,
      qty: Math.min(qty, variant.stock),
      maxStock: variant.stock,
    });
    toast.success("Adicionado ao carrinho");
  };

  return (
    <div className="container-shop pb-6 pt-5">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground" aria-label="Você está aqui">
        <Link to="/" className="inline-flex min-h-11 min-w-11 items-center px-1 transition-colors duration-200 hover:text-foreground">
          Início
        </Link>
        <ChevronRight className="size-4" />
        <Link to="/produtos" className="inline-flex min-h-11 min-w-11 items-center px-1 transition-colors duration-200 hover:text-foreground">
          Produtos
        </Link>
        <ChevronRight className="size-4" />
        <span className="inline-flex min-h-11 items-center px-1 font-medium text-foreground">{product.name}</span>
      </nav>

      <div className="mt-3 grid gap-8 md:grid-cols-[1.18fr_1fr] md:gap-10">
        <div className="flex gap-3">
          <div className="hidden flex-col gap-3 sm:flex">
            {product.images.map((src, i) => (
              <button
                key={`${src}-${i}`}
                type="button"
                onClick={() => setImage(i)}
                className={cn(
                  "h-20 w-16 overflow-hidden rounded-xl border-2 transition-[border-color,opacity] duration-200",
                  i === image ? "border-wine" : "border-transparent opacity-70 hover:opacity-100",
                )}
                aria-label={`Ver foto ${i + 1} de ${product.name}`}
                aria-pressed={i === image}
              >
                <img src={src} alt="" width={128} height={160} className="size-full object-cover" loading="lazy" decoding="async" />
              </button>
            ))}
          </div>
          <div className="relative aspect-[4/5] flex-1 overflow-hidden rounded-3xl bg-muted">
            {currentImage ? (
              <img
                key={currentImage}
                src={currentImage}
                alt={product.name}
                width={800}
                height={1000}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="absolute inset-0 size-full object-cover"
              />
            ) : (
              <span className="absolute inset-0 grid place-items-center text-muted-foreground">
                <ShoppingBag className="size-10" />
              </span>
            )}
            {off > 0 && (
              <span className="absolute left-3 top-3 rounded-full bg-wine px-3 py-1.5 text-sm font-semibold text-white">-{off}%</span>
            )}
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/produtos?category=${encodeURIComponent(product.category.slug)}`}
              className="inline-flex min-h-11 items-center rounded-full border border-border bg-white px-3 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:border-ink"
            >
              {product.category.name}
            </Link>
            {product.isNew && (
              <span className="inline-flex min-h-11 items-center rounded-full bg-wine-soft px-3 text-sm font-medium text-wine">Novidade</span>
            )}
            {product.isFeatured && (
              <span className="inline-flex min-h-11 items-center rounded-full bg-ink px-3 text-sm font-medium text-white">Destaque</span>
            )}
          </div>
          <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">{product.name}</h1>
          <p className="mt-3 flex flex-wrap items-baseline gap-3">
            <span className="font-display text-2xl font-bold text-wine sm:text-3xl">{formatBRL(product.price)}</span>
            {product.compareAtPrice ? (
              <span className="text-sm text-muted-foreground line-through">{formatBRL(product.compareAtPrice)}</span>
            ) : null}
          </p>

          {sizes.length > 0 && (
            <div className="mt-6">
              <p className="text-sm">
                <span className="font-semibold">Tamanho:</span>{" "}
                <span className="text-muted-foreground">{size ?? "selecione"}</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setSelectedSize(s);
                      setSelectedColor(undefined);
                      setQty(1);
                    }}
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
          )}

          {colors.length > 0 && (
            <div className="mt-6">
              <p className="text-sm">
                <span className="font-semibold">Cor:</span>{" "}
                <span className="text-muted-foreground">{color ?? "selecione"}</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {sellable
                  .filter((v) => v.size === size)
                  .filter((v, i, list) => list.findIndex((x) => x.color === v.color) === i)
                  .map((v) => (
                    <button
                      key={v.color}
                      type="button"
                      title={v.color}
                      aria-label={v.color}
                      aria-pressed={color === v.color}
                      onClick={() => {
                        setSelectedColor(v.color);
                        setQty(1);
                      }}
                      className={cn(
                        "grid size-11 place-items-center rounded-full transition-shadow duration-200",
                        color === v.color ? "ring-2 ring-wine ring-offset-2" : "hover:ring-2 hover:ring-black/20 hover:ring-offset-2",
                      )}
                    >
                      <span className="size-7 rounded-full ring-1 ring-inset ring-black/15" style={{ background: v.colorHex ?? "#d4d4d4" }} />
                    </button>
                  ))}
              </div>
            </div>
          )}

          <div className="mt-7 flex flex-wrap gap-3">
            <div className="flex h-12 w-[128px] shrink-0 items-center justify-between rounded-full border border-border bg-white px-1">
              <button
                type="button"
                className="grid size-11 shrink-0 place-items-center rounded-full transition-colors duration-200 hover:bg-muted disabled:opacity-40"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                aria-label="Diminuir quantidade"
              >
                <Minus className="size-4" />
              </button>
              <span className="w-8 text-center text-sm font-medium">{Math.min(qty, maxQty)}</span>
              <button
                type="button"
                className="grid size-11 shrink-0 place-items-center rounded-full transition-colors duration-200 hover:bg-muted disabled:opacity-40"
                onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                disabled={qty >= maxQty}
                aria-label="Aumentar quantidade"
              >
                <Plus className="size-4" />
              </button>
            </div>
            <Button onClick={submit} disabled={soldOut} size="lg" className="min-w-[200px] flex-1">
              <ShoppingBag /> {soldOut ? "Esgotado" : "Adicionar ao carrinho"}
            </Button>
          </div>

          <div className="mt-6 border-t border-border pt-5">
            <h2 className="font-sans text-sm font-bold">Descrição</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{product.description}</p>
          </div>

          <ul className="mt-5 space-y-3 rounded-2xl border border-border bg-white p-5 text-sm">
            <li className="flex items-center gap-3"><Truck className="size-4 shrink-0 text-wine" /> Envio para a localidade ou retirada na loja</li>
            <li className="flex items-center gap-3"><RefreshCw className="size-4 shrink-0 text-wine" /> Primeira troca grátis em até 7 dias</li>
            <li className="flex items-center gap-3"><ShieldCheck className="size-4 shrink-0 text-wine" /> Pedido confirmado pelo WhatsApp</li>
          </ul>
        </div>
      </div>

      {more.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold">Você também pode gostar</h2>
          <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4">
            {more.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
