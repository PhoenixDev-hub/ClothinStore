import { useState } from "react";
import type { FormEvent } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, Search, ShoppingBag, X, ChevronRight } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/lib/cart";
import { CATEGORIES } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/produtos?tag=new", label: "Novidades", testId: "nav-novidades" },
  ...CATEGORIES.map((c) => ({ to: `/produtos?category=${c.id}`, label: c.short, testId: `nav-${c.id}` })),
  { to: "/produtos?tag=bestseller", label: "Mais Vendidos", testId: "nav-mais-vendidos" },
];

const MESSAGES = [
  "Finalize seu pedido direto pelo WhatsApp",
  "Envio para todo o Brasil",
  "Primeira troca grátis",
  "Atendimento personalizado",
];

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" data-testid="header-logo-link" className={cn("flex items-baseline gap-0.5 font-heading", className)}>
      <span className="text-[22px] font-black uppercase tracking-tight text-ink md:text-[26px]">Look</span>
      <span className="ml-1 text-[22px] font-light uppercase tracking-tight text-ink md:text-[26px]">Show</span>
      <span className="ml-0.5 size-1.5 rounded-full bg-wine md:size-2" />
    </Link>
  );
}

export default function Header() {
  const { count, setOpen } = useCart();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    navigate(term ? `/produtos?q=${encodeURIComponent(term)}` : "/produtos");
    setSearchOpen(false);
  };

  return (
    <header className="sticky top-0 z-40">
      <div className="overflow-hidden bg-wine py-2 text-white" data-testid="announcement-bar">
        <div className="flex w-max animate-marquee gap-12 whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.18em]">
          {[...MESSAGES, ...MESSAGES, ...MESSAGES, ...MESSAGES].map((m, i) => (
            <span key={i} className="flex items-center gap-12">
              {m}
              <span className="size-1 rounded-full bg-white/50" />
            </span>
          ))}
        </div>
      </div>

      <div className="border-b border-neutral-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 md:h-[72px] md:px-8">
          <button
            type="button"
            aria-label="Abrir menu"
            data-testid="header-menu-button"
            onClick={() => setMenuOpen(true)}
            className="-ml-1.5 flex size-10 items-center justify-center rounded-full transition-colors duration-200 hover:bg-neutral-100 lg:hidden"
          >
            <Menu className="size-5" />
          </button>

          <Logo />

          <nav className="ml-8 hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                data-testid={n.testId}
                className="rounded-full px-3 py-2 text-[13px] font-semibold uppercase tracking-wide text-neutral-700 transition-colors duration-200 hover:bg-wine-subtle hover:text-wine"
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            <form onSubmit={submit} className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar produtos"
                data-testid="header-search-input"
                className="h-10 w-44 rounded-full border border-neutral-200 bg-neutral-50 pl-10 pr-4 text-sm outline-none transition-[width,border-color,background-color] duration-300 focus:w-60 focus:border-wine focus:bg-white xl:w-56"
              />
            </form>
            <button
              type="button"
              aria-label="Buscar"
              data-testid="header-search-toggle"
              onClick={() => setSearchOpen((v) => !v)}
              className="flex size-10 items-center justify-center rounded-full transition-colors duration-200 hover:bg-neutral-100 md:hidden"
            >
              {searchOpen ? <X className="size-5" /> : <Search className="size-5" />}
            </button>
            <button
              type="button"
              aria-label="Abrir sacola"
              data-testid="header-cart-button"
              onClick={() => setOpen(true)}
              className="relative flex size-10 items-center justify-center rounded-full bg-ink text-white transition-[transform,background-color] duration-200 hover:bg-wine active:scale-95"
            >
              <ShoppingBag className="size-[18px]" />
              {count > 0 && (
                <span
                  key={count}
                  data-testid="header-cart-count"
                  className="absolute -right-1 -top-1 flex min-w-5 animate-pop items-center justify-center rounded-full bg-wine px-1 text-[10px] font-bold leading-5 text-white ring-2 ring-white"
                >
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>

        {searchOpen && (
          <form onSubmit={submit} className="border-t border-neutral-100 px-4 py-3 md:hidden animate-fade-up">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="O que você procura?"
                data-testid="header-mobile-search-input"
                className="h-11 w-full rounded-full border border-neutral-200 bg-neutral-50 pl-10 pr-4 text-base outline-none focus:border-wine focus:bg-white"
              />
            </div>
          </form>
        )}
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="gap-0 p-0 data-[side=left]:w-[85%]" data-testid="mobile-menu">
          <div className="border-b border-neutral-100 px-5 py-5">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <Logo />
          </div>
          <nav className="flex flex-col p-3">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setMenuOpen(false)}
                data-testid={`mobile-${n.testId}`}
                className="flex items-center justify-between rounded-xl px-3 py-3.5 text-[15px] font-semibold text-ink transition-colors duration-200 hover:bg-wine-subtle hover:text-wine"
              >
                {n.label}
                <ChevronRight className="size-4 text-neutral-400" />
              </Link>
            ))}
            <Link
              to="/produtos"
              onClick={() => setMenuOpen(false)}
              data-testid="mobile-nav-todos"
              className="mt-2 rounded-full bg-ink px-4 py-3 text-center text-sm font-semibold text-white"
            >
              Ver todos os produtos
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
