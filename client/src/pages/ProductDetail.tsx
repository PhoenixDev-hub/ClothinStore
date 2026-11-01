import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { ChevronRight, Minus, Plus, RefreshCw, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import { toast } from "sonner";
import { useProduct, useProducts } from "@/hooks/queries";
import { ProductCard } from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Swatch } from "@/components/Swatch";
import { useCart } from "@/store/cart";
import { categoryLabel, cn, discountPercent, formatBRL } from "@/lib/utils";

function Loading() {
  return (
    <div className="container-shop pt-5">
      <Skeleton className="h-3 w-40 rounded-full" />
      <div className="mt-4 grid gap-8 md:grid-cols-[1.2fr_1fr]">
        <Skeleton className="aspect-[4/5] w-full" />
        <div className="space-y-4">
          <Skeleton className="h-5 w-64 rounded-full" />
          <Skeleton className="h-5 w-32 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const { data: product, isLoading, isError } = useProduct(id);
  const { data: related } = useProducts(product ? { category: product.category } : {});
  const add = useCart((s) => s.add);

  const [img, setImg] = useState(0);
  const [color, setColor] = useState<string>();
  const [size, setSize] = useState<string>();
  const [qty, setQty] = useState(1);
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    setImg(0);
    setColor(undefined);
    setSize(undefined);
    setQty(1);
    setAttempted(false);
  }, [id]);

  if (isLoading) return <Loading />;
  if (isError || !product)
    return (
      <div className="container-shop grid place-items-center py-32 text-center">
        <div>
          <h1 className="text-2xl font-bold">Produto não encontrado</h1>
          <p className="mt-2 text-sm text-muted-foreground">Esse item pode ter saído do catálogo.</p>
          <Button asChild className="mt-6">
            <Link to="/produtos">Ver todos os produtos</Link>
          </Button>
        </div>
      </div>
    );

  const off = discountPercent(product.price, product.compareAtPrice);
  const needColor = product.colors.length > 0 && !color;
  const needSize = product.sizes.length > 0 && !size;
  const soldOut = product.stock <= 0;
  const more = related?.filter((p) => p.id !== product.id).slice(0, 4) ?? [];

  const submit = () => {
    setAttempted(true);
    if (needColor || needSize) {
      toast.error(`Selecione ${[needColor && "a cor", needSize && "o tamanho"].filter(Boolean).join(" e ")}`);
      return;
    }
    add({ productId: product.id, name: product.name, image: product.images[0], price: product.price, color, size, qty });
    toast.success("Adicionado ao carrinho");
  };

  return (
    <div className="container-shop pb-6 pt-5">
      <nav className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Início</Link>
        <ChevronRight className="size-3" />
        <Link to="/produtos" className="hover:text-foreground">Produtos</Link>
        <ChevronRight className="size-3" />
        <span className="font-medium text-foreground">{product.name}</span>
      </nav>

      <div className="mt-4 grid gap-8 md:grid-cols-[1.18fr_1fr] md:gap-10">
        <div className="flex gap-3">
          <div className="hidden flex-col gap-2.5 sm:flex">
            {product.images.map((src, i) => (
              <button
                key={src + i}
                onClick={() => setImg(i)}
                className={cn(
                  "h-[72px] w-[54px] overflow-hidden rounded-xl border-2 transition",
                  i === img ? "border-wine" : "border-transparent opacity-70 hover:opacity-100",
                )}
              >
                <img src={src} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
          <div className="relative aspect-[4/5] flex-1 overflow-hidden rounded-3xl bg-muted">
            <AnimatePresence mode="wait">
              <motion.img
                key={img}
                src={product.images[img]}
                alt={product.name}
                initial={{ opacity: 0, scale: 1.03 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 size-full object-cover"
              />
            </AnimatePresence>
            {off > 0 && <span className="absolute left-3 top-3 rounded-full bg-wine px-2.5 py-1 text-[9px] font-bold text-white">-{off}%</span>}
          </div>
        </div>

        <div>
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full border border-border bg-white px-2.5 py-1 text-[8px] font-semibold uppercase tracking-wider text-muted-foreground">{categoryLabel(product.category)}</span>
            {product.isNew && <span className="rounded-full bg-wine-soft px-2.5 py-1 text-[8px] font-semibold uppercase tracking-wider text-wine">Novidade</span>}
            {product.isBestSeller && <span className="rounded-full bg-ink px-2.5 py-1 text-[8px] font-semibold uppercase tracking-wider text-white">Mais vendido</span>}
          </div>
          <h1 className="mt-4 text-[30px] font-bold leading-tight">{product.name}</h1>
          <p className="mt-2 flex items-baseline gap-2.5">
            <span className="font-display text-[22px] font-bold text-wine">{formatBRL(product.price)}</span>
            {product.compareAtPrice ? <span className="text-xs text-muted-foreground line-through">{formatBRL(product.compareAtPrice)}</span> : null}
          </p>

          {product.colors.length > 0 && (
            <div className="mt-6">
              <p className="text-[11px]">
                <span className="font-semibold">Cor:</span> <span className={cn("text-muted-foreground", attempted && needColor && "text-red-600")}>{color ?? "selecione"}</span>
              </p>
              <div className="mt-2.5 flex gap-2.5">
                {product.colors.map((c) => (
                  <button
                    key={c.name}
                    title={c.name}
                    aria-label={c.name}
                    onClick={() => setColor(c.name)}
                    className={cn("grid size-[26px] place-items-center rounded-full ring-offset-2 transition", color === c.name ? "ring-2 ring-wine" : "hover:ring-2 hover:ring-black/20")}
                  >
                    <Swatch hex={c.hex} className="size-[26px]" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.sizes.length > 0 && (
            <div className="mt-5">
              <p className="text-[11px]">
                <span className="font-semibold">Tamanho:</span> <span className={cn("text-muted-foreground", attempted && needSize && "text-red-600")}>{size ?? "selecione"}</span>
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={cn(
                      "grid h-8 min-w-8 place-items-center rounded-full border px-3 text-[10px] font-medium transition",
                      size === s ? "border-ink bg-ink text-white" : "border-border bg-white hover:border-ink",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <div className="flex h-10 w-[104px] items-center justify-between rounded-full border border-border bg-white px-1">
              <button className="grid size-8 place-items-center rounded-full hover:bg-muted" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Diminuir">
                <Minus className="size-3" />
              </button>
              <span className="text-xs font-medium">{qty}</span>
              <button className="grid size-8 place-items-center rounded-full hover:bg-muted" onClick={() => setQty((q) => Math.min(product.stock || 1, q + 1))} aria-label="Aumentar">
                <Plus className="size-3" />
              </button>
            </div>
            <Button onClick={submit} disabled={soldOut} className="h-10 flex-1 text-xs">
              <ShoppingBag /> {soldOut ? "Esgotado" : "Adicionar ao carrinho"}
            </Button>
          </div>

          <div className="mt-6 border-t border-border pt-5">
            <h3 className="font-sans text-[11px] font-bold">Descrição</h3>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{product.description}</p>
          </div>

          <ul className="mt-4 space-y-2.5 rounded-2xl border border-border bg-white p-4 text-[10px]">
            <li className="flex items-center gap-2.5"><Truck className="size-3 text-wine" /> Envio para todo o Brasil ou retirada na loja</li>
            <li className="flex items-center gap-2.5"><RefreshCw className="size-3 text-wine" /> Primeira troca grátis em até 7 dias</li>
            <li className="flex items-center gap-2.5"><ShieldCheck className="size-3 text-wine" /> Pedido confirmado pelo WhatsApp</li>
          </ul>
        </div>
      </div>

      {more.length > 0 && (
        <section className="mt-16">
          <h2 className="text-[22px] font-bold">Você também pode gostar</h2>
          <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-4">
            {more.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </section>
      )}
    </div>
  );
}
