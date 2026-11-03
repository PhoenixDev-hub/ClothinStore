import { Link } from "react-router";
import { CreditCard, MessageCircle, RefreshCw, ShieldCheck, Truck } from "lucide-react";
import { Logo } from "./Logo";
import { useCategories } from "@/hooks/queries";

const YEAR = new Date().getFullYear();

const PERKS = [
  { icon: Truck, title: "Frete para todo o Brasil", text: "Correios, motoboy ou retirada na loja" },
  { icon: RefreshCw, title: "Troca fácil", text: "Primeira troca grátis em até 7 dias" },
  { icon: ShieldCheck, title: "Compra segura", text: "Pedido confirmado com atendimento humano" },
  { icon: CreditCard, title: "Pagamento flexível", text: "Pix ou cartão, combinado no WhatsApp" },
];

const STEPS = [
  "Escolha suas peças, tamanho e cor",
  "Adicione ao carrinho e revise o pedido",
  "Envie o pedido pelo WhatsApp",
  "Combine pagamento e entrega com a gente",
];

export function Footer() {
  const { data: categories } = useCategories();
  return (
    <footer className="mt-20 bg-ink-soft text-white">
      <div className="border-b border-white/10">
        <div className="container-shop grid gap-6 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {PERKS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10">
                <Icon className="size-4 text-white/80" />
              </span>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="mt-1 text-sm leading-snug text-white/70">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="container-shop grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo className="text-white" dotClass="text-rose" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/70">
            Moda para todas as idades — do look de trabalho ao treino, dos acessórios às peças das pequenas.
          </p>
          <Link
            to="/carrinho"
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#0f7a3f] px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#0b6b38]"
          >
            <MessageCircle className="size-4" /> Enviar pedido pelo WhatsApp
          </Link>
        </div>
        <div>
          <h4 className="font-sans text-sm font-semibold text-white/80">Categorias</h4>
          <ul className="mt-2 text-sm">
            {(categories ?? []).map((c) => (
              <li key={c.slug}>
                <Link
                  to={`/produtos?category=${encodeURIComponent(c.slug)}`}
                  className="inline-flex min-h-11 items-center text-white/90 transition-colors duration-200 hover:text-rose"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-sans text-sm font-semibold text-white/80">Como comprar</h4>
          <ol className="mt-2 text-sm text-white/90">
            {STEPS.map((s, i) => (
              <li key={s} className="flex min-h-11 items-center gap-1.5">
                <span className="text-white/60">{i + 1}.</span> {s}
              </li>
            ))}
          </ol>
        </div>
      </div>
      <div className="border-t border-white/10 py-6 text-center text-sm text-white/70">
        © {YEAR} Look Show. Todos os direitos reservados.
      </div>
    </footer>
  );
}
