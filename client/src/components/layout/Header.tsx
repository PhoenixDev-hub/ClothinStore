import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from "react-router";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { motion } from "motion/react";
import { Logo } from "./Logo";
import { useCart, cartCount } from "@/store/cart";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Novidades", to: "/produtos?tag=new", match: (p: URLSearchParams) => p.get("tag") === "new" },
  { label: "Feminino", to: "/produtos?category=feminino", match: (p: URLSearchParams) => p.get("category") === "feminino" },
  { label: "Fitness", to: "/produtos?category=fitness", match: (p: URLSearchParams) => p.get("category") === "fitness" },
  { label: "Acessórios", to: "/produtos?category=acessorios", match: (p: URLSearchParams) => p.get("category") === "acessorios" },
  { label: "Infantil", to: "/produtos?category=infantil", match: (p: URLSearchParams) => p.get("category") === "infantil" },
  { label: "Mais Vendidos", to: "/produtos?tag=bestseller", match: (p: URLSearchParams) => p.get("tag") === "bestseller" },
];

export function Header() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const [term, setTerm] = useState("");
  const [mobile, setMobile] = useState(false);
  const count = useCart((s) => cartCount(s.items));
  const setOpen = useCart((s) => s.setOpen);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = term.trim();
    navigate(q ? `/produtos?q=${encodeURIComponent(q)}` : "/produtos");
    setMobile(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-white/90 backdrop-blur-md">
      <div className="container-shop flex h-[50px] items-center gap-8 sm:h-[52px]">
        <button className="-ml-1 grid size-9 place-items-center rounded-full hover:bg-muted lg:hidden" onClick={() => setMobile((v) => !v)} aria-label="Menu">
          {mobile ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => {
            const active = pathname === "/produtos" && n.match(params);
            return (
              <NavLink
                key={n.label}
                to={n.to}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide transition-colors hover:text-wine",
                  active ? "bg-wine-soft text-wine" : "text-foreground",
                )}
              >
                {n.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2.5">
          <form onSubmit={submit} className="relative hidden sm:block">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Buscar produtos"
              className="h-8 w-[148px] rounded-full border border-border bg-white pl-8 pr-3 text-[11px] outline-none transition-all placeholder:text-muted-foreground focus:w-52 focus:border-wine"
            />
          </form>
          <button
            onClick={() => setOpen(true)}
            aria-label="Abrir carrinho"
            className="relative grid size-8 place-items-center rounded-full bg-ink text-white transition hover:bg-wine"
          >
            <ShoppingBag className="size-3.5" />
            {count > 0 && (
              <motion.span
                key={count}
                initial={{ scale: 0.4 }}
                animate={{ scale: 1 }}
                className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-wine px-1 text-[9px] font-bold leading-4 ring-2 ring-white"
              >
                {count}
              </motion.span>
            )}
          </button>
        </div>
      </div>
      {mobile && (
        <div className="border-t border-border bg-white lg:hidden">
          <form onSubmit={submit} className="container-shop pt-3 sm:hidden">
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Buscar produtos"
              className="h-10 w-full rounded-full border border-border px-4 text-sm outline-none focus:border-wine"
            />
          </form>
          <nav className="container-shop grid gap-0.5 py-3">
            {NAV.map((n) => (
              <Link key={n.label} to={n.to} onClick={() => setMobile(false)} className="rounded-xl px-3 py-2.5 text-sm font-medium uppercase tracking-wide hover:bg-muted">
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
