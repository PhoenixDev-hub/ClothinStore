import { Link } from "react-router";
import { ArrowRight, ShoppingBag, WifiOff } from "lucide-react";
import { useCategories, useProducts } from "@/hooks/queries";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";

export default function Home() {
  const categories = useCategories();
  const products = useProducts({ limit: 8 });
  const list = products.data?.data ?? [];
  const newItems = (list.some((p) => p.isNew) ? list.filter((p) => p.isNew) : list).slice(0, 4);
  const featured = list.find((p) => p.isFeatured) ?? list[0];
  const failed = products.isError || categories.isError;

  return (
    <>
      <section className="container-shop pt-4">
        <div className="grid gap-3 lg:grid-cols-[2.04fr_1fr]">
          <div className="relative min-h-[420px] overflow-hidden rounded-[22px] bg-ink text-white">
            {featured?.images[0] && (
              <img
                src={featured.images[0]}
                alt={featured.name}
                width={900}
                height={1100}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="absolute inset-y-0 right-0 hidden h-full w-[58%] object-cover object-left sm:block"
              />
            )}
            <div className="absolute inset-0 hidden bg-gradient-to-r from-ink from-38% via-ink/60 via-52% to-transparent to-72% sm:block" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent sm:hidden" />
            <div className="relative z-10 flex h-full max-w-md flex-col justify-center p-8 sm:p-10">
              <span className="w-fit rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-sm font-medium text-white backdrop-blur">
                Nova coleção
              </span>
              <h1 className="mt-5 text-5xl font-extrabold leading-[0.95] sm:text-6xl">
                Seu look.
                <br />
                <em className="font-light italic text-rose">Seu show.</em>
              </h1>
              <p className="mt-5 max-w-[19rem] text-base leading-relaxed text-white/90">
                Peças que acompanham cada fase da sua vida — do trabalho ao treino, das festas aos passeios com as pequenas.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild>
                  <Link to="/produtos">Comprar agora</Link>
                </Button>
                <Button asChild variant="glass">
                  <Link to="/produtos">Ver catálogo</Link>
                </Button>
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {(categories.data ?? []).slice(0, 2).map((c) => (
              <Link
                key={c.slug}
                to={`/produtos?category=${encodeURIComponent(c.slug)}`}
                className="group relative flex h-[198px] flex-col justify-end overflow-hidden rounded-[22px] bg-wine p-5 text-white"
              >
                {c.image && (
                  <img
                    src={c.image}
                    alt={c.name}
                    width={640}
                    height={480}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 size-full object-cover opacity-80 transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                <div className="relative flex items-end justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white/90">{c._count?.products ?? 0} peças</p>
                    <p className="font-display text-lg font-semibold">{c.name}</p>
                  </div>
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-ink transition-transform duration-200 group-hover:rotate-45">
                    <ArrowRight className="size-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <ul className="mx-auto mt-8 flex max-w-2xl flex-wrap justify-center gap-x-8 gap-y-5 sm:gap-x-10">
          {(categories.data ?? []).map((c) => (
            <li key={c.slug}>
              <Link to={`/produtos?category=${encodeURIComponent(c.slug)}`} className="group flex flex-col items-center gap-2">
                <span className="rounded-full bg-gradient-to-br from-rose/60 to-wine/30 p-[2px] transition-transform duration-200 group-hover:scale-105">
                  {c.image ? (
                    <img
                      src={c.image}
                      alt={c.name}
                      width={144}
                      height={144}
                      loading="lazy"
                      decoding="async"
                      className="size-[72px] rounded-full border-2 border-white object-cover"
                    />
                  ) : (
                    <span className="grid size-[72px] place-items-center rounded-full border-2 border-white bg-wine-soft text-wine">
                      <ShoppingBag className="size-5" />
                    </span>
                  )}
                </span>
                <span className="text-sm font-medium">{c.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="container-shop mt-16">
        <SectionHeading title="Novidades" to="/produtos" />
        {failed ? (
          <div className="mt-6 grid place-items-center rounded-3xl border border-dashed border-border bg-white px-6 py-20 text-center">
            <div>
              <span className="mx-auto grid size-14 place-items-center rounded-full bg-wine-soft text-wine">
                <WifiOff className="size-6" />
              </span>
              <p className="mt-4 font-display text-lg font-semibold">Não foi possível carregar o catálogo</p>
              <p className="mt-1 text-sm text-muted-foreground">Confira sua conexão e tente de novo.</p>
              <Button
                variant="dark"
                className="mt-5"
                onClick={() => {
                  products.refetch();
                  categories.refetch();
                }}
              >
                Tentar novamente
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4">
            {products.isLoading
              ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : newItems.map((p, i) => <ProductCard key={p.id} product={p} priority={i === 0} />)}
          </div>
        )}
        {!products.isLoading && !failed && list.length === 0 && (
          <div className="mt-6 grid place-items-center rounded-3xl border border-dashed border-border bg-white px-6 py-20 text-center">
            <div>
              <span className="mx-auto grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">
                <ShoppingBag className="size-6" />
              </span>
              <p className="mt-4 font-display text-lg font-semibold">Nenhum produto cadastrado ainda</p>
              <p className="mt-1 text-sm text-muted-foreground">Assim que a loja publicar peças, elas aparecem aqui.</p>
            </div>
          </div>
        )}
      </section>

      <section className="container-shop mt-16">
        <div className="grid overflow-hidden rounded-[22px] bg-ink-soft text-white md:grid-cols-2">
          {featured?.images[0] && (
            <img
              src={featured.images[0]}
              alt={featured.name}
              width={800}
              height={900}
              loading="lazy"
              decoding="async"
              className="h-64 w-full object-cover object-top md:h-full"
            />
          )}
          <div className="flex flex-col justify-center p-8 md:p-10">
            <p className="text-sm font-semibold text-rose">Para todas as idades</p>
            <h2 className="mt-3 text-3xl font-bold leading-[1.05] sm:text-4xl">Elegância que não pede licença.</h2>
            <p className="mt-4 max-w-sm text-base leading-relaxed text-white/80">
              Curadoria de peças versáteis, com caimento impecável e preço justo. Monte seu look e finalize em minutos pelo WhatsApp.
            </p>
            <Button asChild variant="light" className="mt-7 w-fit">
              <Link to="/produtos">
                Explorar catálogo <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
