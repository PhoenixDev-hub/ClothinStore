import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import ProductGrid from "@/components/store/ProductGrid";
import { apiGet } from "@/lib/api";
import { CATEGORIES, IMAGES } from "@/lib/store";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

function SectionHead({ eyebrow, title, to, testId }: { eyebrow: string; title: string; to: string; testId: string }) {
  return (
    <div className="mb-7 flex items-end justify-between gap-4">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-wine">{eyebrow}</p>
        <h2 className="mt-1.5 font-heading text-3xl font-bold tracking-tight text-ink md:text-4xl">{title}</h2>
      </div>
      <Link
        to={to}
        data-testid={testId}
        className="group flex shrink-0 items-center gap-1.5 text-sm font-semibold text-ink underline-offset-4 hover:underline"
      >
        Ver tudo
        <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
      </Link>
    </div>
  );
}

export default function Home() {
  const news = useQuery({
    queryKey: ["products", "home-new"],
    queryFn: () => apiGet<Product[]>("/products?tag=new&limit=4"),
  });
  const best = useQuery({
    queryKey: ["products", "home-best"],
    queryFn: () => apiGet<Product[]>("/products?tag=bestseller&limit=4"),
  });

  return (
    <div data-testid="home-page">
      {/* HERO */}
      <section className="mx-auto max-w-7xl px-4 pt-4 md:px-8 md:pt-6">
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="relative min-h-[520px] overflow-hidden rounded-[28px] bg-ink lg:col-span-8 lg:min-h-[600px]">
            <img
              src={IMAGES.hero}
              alt="Coleção Look Show"
              className="absolute inset-0 size-full object-cover object-[center_25%]"
              data-testid="hero-image"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent md:bg-gradient-to-r md:from-black/75 md:via-black/35 md:to-black/10" />
            <div className="relative flex h-full min-h-[520px] flex-col justify-end p-6 sm:p-10 lg:min-h-[600px] lg:justify-center lg:p-14">
              <span className="w-fit rounded-full border border-white/30 bg-white/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-md animate-fade-up">
                Nova coleção
              </span>
              <h1
                className="mt-5 max-w-xl font-heading text-[44px] font-black leading-[0.95] tracking-tight text-white animate-fade-up sm:text-6xl lg:text-7xl"
                style={{ animationDelay: "80ms" }}
                data-testid="hero-title"
              >
                Seu look.
                <br />
                <span className="font-light italic text-rose-200">Seu show.</span>
              </h1>
              <p
                className="mt-5 max-w-md text-[15px] leading-relaxed text-neutral-200 animate-fade-up md:text-base"
                style={{ animationDelay: "160ms" }}
              >
                Peças que acompanham cada fase da sua vida — do trabalho ao treino, das festas aos passeios com as pequenas.
              </p>
              <div className="mt-8 flex flex-wrap gap-3 animate-fade-up" style={{ animationDelay: "240ms" }}>
                <Link
                  to="/produtos"
                  data-testid="hero-shop-button"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-12 rounded-full px-7 text-[15px] font-semibold transition-transform duration-150 active:scale-[0.97]",
                  )}
                >
                  Comprar agora
                </Link>
                <Link
                  to="/produtos?tag=new"
                  data-testid="hero-news-button"
                  className="flex h-12 items-center rounded-full border border-white/40 bg-white/10 px-7 text-[15px] font-semibold text-white backdrop-blur-md transition-colors duration-200 hover:bg-white hover:text-ink"
                >
                  Ver novidades
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:col-span-4 lg:grid-cols-1">
            <Link
              to="/produtos?category=fitness"
              data-testid="hero-side-fitness"
              className="group relative min-h-[220px] overflow-hidden rounded-[28px] bg-neutral-200"
            >
              <img
                src={IMAGES.fitnessBanner}
                alt="Linha fitness"
                className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-rose-200">Performance</p>
                  <p className="font-heading text-xl font-bold text-white md:text-2xl">Linha Fitness</p>
                </div>
                <span className="flex size-9 items-center justify-center rounded-full bg-white text-ink transition-transform duration-300 group-hover:rotate-45">
                  <ArrowUpRight className="size-4" />
                </span>
              </div>
            </Link>
            <Link
              to="/produtos?category=acessorios"
              data-testid="hero-side-acessorios"
              className="group relative min-h-[220px] overflow-hidden rounded-[28px] bg-wine"
            >
              <img
                src={CATEGORIES[2].image.replace("w=400", "w=900")}
                alt="Acessórios"
                className="absolute inset-0 size-full object-cover opacity-80 mix-blend-luminosity transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-wine via-wine/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-rose-200">Detalhes</p>
                  <p className="font-heading text-xl font-bold text-white md:text-2xl">Acessórios</p>
                </div>
                <span className="flex size-9 items-center justify-center rounded-full bg-white text-ink transition-transform duration-300 group-hover:rotate-45">
                  <ArrowUpRight className="size-4" />
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* CATEGORIAS CIRCULARES */}
      <section className="mx-auto max-w-7xl px-4 pt-12 md:px-8" data-testid="home-categories">
        <div className="no-scrollbar -mx-4 flex gap-5 overflow-x-auto px-4 sm:justify-center sm:gap-10 md:gap-14">
          {[
            { id: "new", label: "Novidades", to: "/produtos?tag=new", image: IMAGES.editorial.replace("w=1200", "w=400") },
            ...CATEGORIES.map((c) => ({ id: c.id, label: c.short, to: `/produtos?category=${c.id}`, image: c.image })),
          ].map((c) => (
            <Link
              key={c.id}
              to={c.to}
              data-testid={`home-category-${c.id}`}
              className="group flex shrink-0 flex-col items-center gap-2.5"
            >
              <span className="rounded-full p-[3px] ring-2 ring-wine/20 transition-[box-shadow,transform] duration-300 group-hover:-translate-y-1 group-hover:ring-wine">
                <img
                  src={c.image}
                  alt={c.label}
                  className="size-[72px] rounded-full object-cover md:size-24"
                  loading="lazy"
                />
              </span>
              <span className="text-xs font-semibold uppercase tracking-wide text-ink md:text-[13px]">{c.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* NOVIDADES */}
      <section className="mx-auto max-w-7xl px-4 pt-16 md:px-8" data-testid="home-novidades">
        <SectionHead eyebrow="Acabou de chegar" title="Novidades" to="/produtos?tag=new" testId="home-novidades-link" />
        <ProductGrid products={news.data} loading={news.isLoading} error={news.isError} testId="novidades-grid" />
      </section>

      {/* BANNER EDITORIAL */}
      <section className="mx-auto max-w-7xl px-4 pt-20 md:px-8">
        <div className="grid overflow-hidden rounded-[28px] bg-ink md:grid-cols-2">
          <div className="relative min-h-[320px] md:min-h-[440px]">
            <img
              src={IMAGES.editorial}
              alt="Editorial Look Show"
              loading="lazy"
              className="absolute inset-0 size-full object-cover"
            />
          </div>
          <div className="flex flex-col justify-center gap-5 p-8 md:p-14">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-rose-300">Para todas as idades</p>
            <h2 className="font-heading text-4xl font-bold leading-[1.05] tracking-tight text-white md:text-5xl">
              Elegância que não pede licença.
            </h2>
            <p className="max-w-md text-[15px] leading-relaxed text-neutral-400">
              Curadoria de peças versáteis, com caimento impecável e preço justo. Monte seu look e finalize em minutos pelo
              WhatsApp.
            </p>
            <Link
              to="/produtos?category=feminino"
              data-testid="editorial-cta"
              className="mt-2 flex h-12 w-fit items-center gap-2 rounded-full bg-white px-7 text-[15px] font-semibold text-ink transition-colors duration-200 hover:bg-rose-100"
            >
              Explorar feminino <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* MAIS VENDIDOS */}
      <section className="mx-auto max-w-7xl px-4 pt-20 md:px-8" data-testid="home-mais-vendidos">
        <SectionHead
          eyebrow="Queridinhos da semana"
          title="Mais Vendidos"
          to="/produtos?tag=bestseller"
          testId="home-mais-vendidos-link"
        />
        <ProductGrid products={best.data} loading={best.isLoading} error={best.isError} testId="mais-vendidos-grid" />
      </section>
    </div>
  );
}
