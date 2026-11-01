import { Link } from "react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";
import { useProducts } from "@/hooks/queries";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";

const STORIES = [
  { label: "Novidades", to: "/produtos?tag=new", img: "/img/cat-novidades.jpg" },
  { label: "Feminino", to: "/produtos?category=feminino", img: "/img/cat-feminino.jpg" },
  { label: "Fitness", to: "/produtos?category=fitness", img: "/img/cat-fitness.jpg" },
  { label: "Acessórios", to: "/produtos?category=acessorios", img: "/img/cat-acessorios.jpg" },
  { label: "Infantil", to: "/produtos?category=infantil", img: "/img/cat-infantil.jpg" },
];

function Shelf({ eyebrow, title, to, tag }: { eyebrow: string; title: string; to: string; tag: "new" | "bestseller" }) {
  const { data, isLoading } = useProducts({ tag });
  return (
    <section className="container-shop mt-14">
      <SectionHeading eyebrow={eyebrow} title={title} to={to} />
      <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : data?.slice(0, 4).map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <section className="container-shop pt-4">
        <div className="grid gap-3 lg:grid-cols-[2.04fr_1fr]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative min-h-[400px] overflow-hidden rounded-[22px] bg-[#0b0d0c] text-white"
          >
            <img src="/img/hero.jpg" alt="" className="absolute inset-y-0 right-0 hidden h-full w-[58%] object-cover object-left opacity-100 sm:block" />
            <div className="absolute inset-0 hidden bg-gradient-to-r from-[#0b0d0c] from-38% via-[#0b0d0c]/60 via-52% to-transparent to-72% sm:block" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent sm:hidden" />
            <div className="relative z-10 flex h-full max-w-md flex-col justify-center p-8 sm:p-10">
              <span className="w-fit rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[8px] font-medium uppercase tracking-[0.18em] backdrop-blur">
                Nova coleção
              </span>
              <h1 className="mt-5 text-[46px] font-extrabold leading-[0.95] sm:text-[52px]">
                Seu look.
                <br />
                <em className="font-light italic text-rose">Seu show.</em>
              </h1>
              <p className="mt-4 max-w-[17rem] text-[12px] leading-relaxed text-white/85">
                Peças que acompanham cada fase da sua vida — do trabalho ao treino, das festas aos passeios com as pequenas.
              </p>
              <div className="mt-6 flex gap-2.5">
                <Button asChild size="sm" className="h-9 px-5 text-[11px]">
                  <Link to="/produtos">Comprar agora</Link>
                </Button>
                <Button asChild variant="glass" size="sm" className="h-9 px-5 text-[11px]">
                  <Link to="/produtos?tag=new">Ver novidades</Link>
                </Button>
              </div>
            </div>
          </motion.div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {[
              { to: "/produtos?category=fitness", eyebrow: "Performance", title: "Linha Fitness", img: "/img/card-fitness.jpg", tone: "from-black/70" },
              { to: "/produtos?category=acessorios", eyebrow: "Detalhes", title: "Acessórios", img: "/img/card-acessorios.jpg", tone: "from-wine/85" },
            ].map((c, i) => (
              <motion.div key={c.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 + i * 0.1 }}>
                <Link to={c.to} className="group relative block h-[194px] overflow-hidden rounded-[22px] bg-wine">
                  <img src={c.img} alt="" className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className={`absolute inset-0 bg-gradient-to-t ${c.tone} via-transparent to-transparent`} />
                  <div className="absolute inset-x-5 bottom-4 flex items-end justify-between text-white">
                    <div>
                      <p className="text-[8px] font-medium uppercase tracking-[0.18em] opacity-80">{c.eyebrow}</p>
                      <p className="font-display text-[17px] font-semibold">{c.title}</p>
                    </div>
                    <span className="grid size-7 place-items-center rounded-full bg-white text-ink transition-transform group-hover:rotate-45">
                      <ArrowUpRight className="size-3.5" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        <ul className="mx-auto mt-8 flex max-w-xl flex-wrap justify-center gap-x-8 gap-y-5 sm:gap-x-9">
          {STORIES.map((s, i) => (
            <motion.li key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.05 }}>
              <Link to={s.to} className="group flex flex-col items-center gap-2">
                <span className="rounded-full bg-gradient-to-br from-rose/60 to-wine/30 p-[2px] transition-transform group-hover:scale-105">
                  <img src={s.img} alt="" className="size-[66px] rounded-full border-2 border-white object-cover" />
                </span>
                <span className="text-[9px] font-medium uppercase tracking-wide">{s.label}</span>
              </Link>
            </motion.li>
          ))}
        </ul>
      </section>

      <Shelf eyebrow="Acabou de chegar" title="Novidades" to="/produtos?tag=new" tag="new" />

      <section className="container-shop mt-14">
        <div className="grid overflow-hidden rounded-[22px] bg-ink-soft text-white md:grid-cols-2">
          <img src="/img/banner-feminino.jpg" alt="" className="h-64 w-full object-cover object-top md:h-full" />
          <div className="flex flex-col justify-center p-8 md:p-10">
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-rose">Para todas as idades</p>
            <h2 className="mt-3 text-[28px] font-bold leading-[1.05]">Elegância que não pede licença.</h2>
            <p className="mt-4 max-w-[17rem] text-[11px] leading-relaxed text-white/65">
              Curadoria de peças versáteis, com caimento impecável e preço justo. Monte seu look e finalize em minutos pelo WhatsApp.
            </p>
            <Button asChild variant="light" size="sm" className="mt-6 h-10 w-fit px-5 text-[11px]">
              <Link to="/produtos?category=feminino">
                Explorar feminino <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Shelf eyebrow="Queridinhos da semana" title="Mais Vendidos" to="/produtos?tag=bestseller" tag="bestseller" />
    </>
  );
}
