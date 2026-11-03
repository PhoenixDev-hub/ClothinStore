import { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { Logo } from "./Logo";
import { cartCount, useCart } from "@/store/cart";
import { useCategories } from "@/hooks/queries";
import { cn } from "@/lib/utils";

export function Header() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const { data: categories } = useCategories();
  const [term, setTerm] = useState("");
  const [mobile, setMobile] = useState(false);
  const count = useCart((s) => cartCount(s.items));
  const setOpen = useCart((s) => s.setOpen);

  const links = [
    { label: "Todos", to: "/produtos", slug: null },
    ...(categories ?? []).map((c) => ({
      label: c.name,
      to: `/produtos?category=${encodeURIComponent(c.slug)}`,
      slug: c.slug,
    })),
  ];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = term.trim();
    navigate(q ? `/produtos?q=${encodeURIComponent(q)}` : "/produtos");
    setMobile(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-white/95 backdrop-blur-md">
      <div className="container-shop flex h-16 items-center gap-6">
        <button
          type="button"
          className="-ml-2 grid size-11 place-items-center rounded-full text-foreground transition-colors duration-200 hover:bg-muted lg:hidden"
          onClick={() => setMobile((v) => !v)}
          aria-label={mobile ? "Fechar menu" : "Abrir menu"}
          aria-expanded={mobile}
          aria-controls="menu-mobile"
        >
          {mobile ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
        <Logo />
        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Categorias">
          {links.map((n) => {
            const active = pathname === "/produtos" && (params.get("category") ?? null) === n.slug;
            return (
              <Link
                key={n.label}
                to={n.to}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium transition-colors duration-200 hover:text-wine",
                  active ? "bg-wine-soft text-wine" : "text-foreground",
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <form onSubmit={submit} role="search" className="relative hidden sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Buscar produtos"
              aria-label="Buscar produtos"
              className="h-11 w-40 rounded-full border border-border bg-white pl-9 pr-4 text-sm outline-none transition-[width,border-color] duration-200 placeholder:text-muted-foreground focus:w-56 focus:border-wine"
            />
          </form>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={`Abrir carrinho${count > 0 ? ` (${count} itens)` : ""}`}
            className="relative grid size-11 place-items-center rounded-full bg-ink text-white transition-colors duration-200 hover:bg-wine"
          >
            <ShoppingBag className="size-5" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-wine px-1 text-sm font-bold leading-5 ring-2 ring-white">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
      {mobile && (
        <div id="menu-mobile" className="border-t border-border bg-white lg:hidden">
          <form onSubmit={submit} role="search" className="container-shop pt-4 sm:hidden">
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Buscar produtos"
              aria-label="Buscar produtos"
              className="h-11 w-full rounded-full border border-border px-4 text-sm outline-none focus:border-wine"
            />
          </form>
          <nav className="container-shop grid gap-1 py-4" aria-label="Categorias">
            {links.map((n) => (
              <Link
                key={n.label}
                to={n.to}
                onClick={() => setMobile(false)}
                className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-medium transition-colors duration-200 hover:bg-muted"
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
