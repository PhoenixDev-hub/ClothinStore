import { Link } from "react-router-dom";
import { CreditCard, MessageCircle, RefreshCw, ShieldCheck, Truck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { CATEGORIES } from "@/lib/store";
import type { StoreSettings } from "@/lib/types";

const BADGES = [
  { icon: Truck, title: "Frete para todo o Brasil", desc: "Correios, motoboy ou retirada na loja" },
  { icon: RefreshCw, title: "Troca fácil", desc: "Primeira troca grátis em até 7 dias" },
  { icon: ShieldCheck, title: "Compra segura", desc: "Pedido confirmado com atendimento humano" },
  { icon: CreditCard, title: "Pagamento flexível", desc: "Pix ou cartão, combinado no WhatsApp" },
];

export default function Footer() {
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => apiGet<StoreSettings>("/settings"),
  });

  return (
    <footer className="mt-20 bg-ink text-white" data-testid="site-footer">
      <div className="border-b border-white/10">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 md:grid-cols-4 md:px-8">
          {BADGES.map((b) => (
            <div key={b.title} className="flex flex-col gap-3 sm:flex-row sm:items-start" data-testid="trust-badge">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-rose-300">
                <b.icon className="size-5" strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-sm font-semibold">{b.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-neutral-400">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-12 md:px-8">
        <div className="md:col-span-5">
          <p className="font-heading text-3xl font-black uppercase tracking-tight">
            Look <span className="ml-1 font-light">Show</span>
            <span className="ml-1 inline-block size-2 rounded-full bg-rose-400" />
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-neutral-400">
            Moda feminina para todas as idades — do look de trabalho ao treino, dos acessórios às peças das pequenas.
          </p>
          {settings && (
            <a
              href={`https://wa.me/${settings.whatsapp_number}`}
              target="_blank"
              rel="noreferrer"
              data-testid="footer-whatsapp-link"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-whatsapp px-5 py-2.5 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
            >
              <MessageCircle className="size-4" /> Fale com a gente
            </a>
          )}
        </div>
        <div className="md:col-span-3">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">Categorias</p>
          <ul className="mt-4 space-y-2.5">
            {CATEGORIES.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/produtos?category=${c.id}`}
                  data-testid={`footer-cat-${c.id}`}
                  className="text-sm text-neutral-300 transition-colors duration-200 hover:text-white"
                >
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="md:col-span-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">Como comprar</p>
          <ol className="mt-4 space-y-2.5 text-sm text-neutral-300">
            <li>1. Escolha suas peças, tamanho e cor</li>
            <li>2. Preencha seus dados no checkout</li>
            <li>3. Envie o pedido pelo WhatsApp</li>
            <li>4. Combine pagamento e entrega com a gente</li>
          </ol>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} Look Show. Todos os direitos reservados.
      </div>
    </footer>
  );
}
