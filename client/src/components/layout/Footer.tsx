import { Link } from "react-router";
import { CreditCard, MessageCircle, RefreshCw, ShieldCheck, Truck } from "lucide-react";
import { Logo } from "./Logo";
import { useSettings } from "@/hooks/queries";
import { CATEGORIES } from "@/lib/utils";

const PERKS = [
  { icon: Truck, title: "Frete para todo o Brasil", text: "Correios, motoboy ou retirada na loja" },
  { icon: RefreshCw, title: "Troca fácil", text: "Primeira troca grátis em até 7 dias" },
  { icon: ShieldCheck, title: "Compra segura", text: "Pedido confirmado com atendimento humano" },
  { icon: CreditCard, title: "Pagamento flexível", text: "Pix ou cartão, combinado no WhatsApp" },
];

const STEPS = [
  "Escolha suas peças, tamanho e cor",
  "Preencha seus dados no checkout",
  "Envie o pedido pelo WhatsApp",
  "Combine pagamento e entrega com a gente",
];

export function Footer() {
  const { data } = useSettings();
  const wa = data?.whatsapp ? `https://wa.me/${data.whatsapp}` : "#";
  return (
    <footer className="mt-20 bg-ink-soft text-white">
      <div className="border-b border-white/10">
        <div className="container-shop grid gap-6 py-7 sm:grid-cols-2 lg:grid-cols-4">
          {PERKS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/[0.07]">
                <Icon className="size-4 text-white/60" />
              </span>
              <div>
                <p className="text-xs font-semibold">{title}</p>
                <p className="mt-0.5 text-[10px] leading-snug text-white/50">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="container-shop grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo className="text-white" dotClass="text-rose" />
          <p className="mt-4 max-w-xs text-xs leading-relaxed text-white/60">
            Moda feminina para todas as idades — do look de trabalho ao treino, dos acessórios às peças das pequenas.
          </p>
          <a
            href={wa}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex h-9 items-center gap-2 rounded-full bg-[#25d366] px-4 text-xs font-semibold text-white transition hover:bg-[#1ebe5b]"
          >
            <MessageCircle className="size-3.5" /> Fale com a gente
          </a>
        </div>
        <div>
          <h4 className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">Categorias</h4>
          <ul className="mt-4 space-y-2.5 text-xs">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link to={`/produtos?category=${c.slug}`} className="text-white/85 transition hover:text-rose">
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">Como comprar</h4>
          <ol className="mt-4 space-y-2 text-xs text-white/85">
            {STEPS.map((s, i) => (
              <li key={s}>
                {i + 1}. {s}
              </li>
            ))}
          </ol>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-[10px] text-white/40">
        © {new Date().getFullYear()} Look Show. Todos os direitos reservados.
        <Link to="/admin" className="ml-3 opacity-0 transition hover:opacity-60" aria-label="Admin">
          ·
        </Link>
      </div>
    </footer>
  );
}
