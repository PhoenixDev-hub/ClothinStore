import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ChevronLeft, Loader2, MessageCircle, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import SafeImage from "@/components/store/SafeImage";
import { apiGet, ApiError } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { formatBRL, SHIPPING_OPTIONS } from "@/lib/store";
import type { ShippingId } from "@/lib/store";
import type { CepResult, StoreSettings } from "@/lib/types";
import { buildOrderMessage, formatCep, formatPhone, whatsappUrl } from "@/lib/whatsapp";
import type { CheckoutData } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

const EMPTY: CheckoutData = {
  name: "",
  phone: "",
  shipping: "correios",
  cep: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  notes: "",
};

type Errors = Partial<Record<keyof CheckoutData, string>>;

function Field({
  id,
  label,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id} className="text-[13px] font-semibold text-neutral-700">
        {label}
      </Label>
      {children}
      {error && (
        <p className="text-xs font-medium text-red-600" data-testid={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

const inputCls = "h-12 rounded-xl border-neutral-300 bg-white px-4 text-base md:text-sm focus-visible:border-wine";

export default function Checkout() {
  const { items, subtotal, clear } = useCart();
  const [d, setD] = useState<CheckoutData>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [cepLoading, setCepLoading] = useState(false);
  const [sentUrl, setSentUrl] = useState<string | null>(null);

  const settings = useQuery({
    queryKey: ["settings"],
    queryFn: () => apiGet<StoreSettings>("/settings"),
  });

  const set = <K extends keyof CheckoutData>(k: K, v: CheckoutData[K]) => {
    setD((prev) => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const lookupCep = async (cep: string) => {
    if (cep.replace(/\D/g, "").length !== 8) return;
    setCepLoading(true);
    try {
      const r = await apiGet<CepResult>(`/cep/${cep.replace(/\D/g, "")}`);
      setD((prev) => ({
        ...prev,
        street: r.street || prev.street,
        neighborhood: r.neighborhood || prev.neighborhood,
        city: r.city || prev.city,
        state: r.state || prev.state,
      }));
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) toast.error("CEP não encontrado. Preencha o endereço manualmente.");
    } finally {
      setCepLoading(false);
    }
  };

  const delivery = d.shipping !== "retirada";

  const validate = (): Errors => {
    const e: Errors = {};
    if (d.name.trim().length < 2) e.name = "Informe seu nome";
    if (delivery) {
      if (d.cep.replace(/\D/g, "").length !== 8) e.cep = "CEP inválido";
      if (!d.street.trim()) e.street = "Informe a rua";
      if (!d.number.trim()) e.number = "Nº";
      if (!d.neighborhood.trim()) e.neighborhood = "Informe o bairro";
      if (!d.city.trim()) e.city = "Informe a cidade";
      if (d.state.trim().length !== 2) e.state = "UF";
    }
    return e;
  };

  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      toast.error("Confira os campos destacados");
      return;
    }
    const number = settings.data?.whatsapp_number;
    if (!number) {
      toast.error("Não foi possível obter o WhatsApp da loja. Tente novamente.");
      return;
    }
    const url = whatsappUrl(number, buildOrderMessage(d, items, subtotal));
    window.open(url, "_blank", "noopener");
    setSentUrl(url);
    clear();
  };

  if (sentUrl) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center md:py-24" data-testid="checkout-success">
        <span className="mx-auto flex size-20 animate-pop items-center justify-center rounded-full bg-whatsapp/15">
          <CheckCircle2 className="size-10 text-whatsapp" />
        </span>
        <h1 className="mt-6 font-heading text-3xl font-bold tracking-tight md:text-4xl">Pedido enviado!</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-neutral-600">
          Abrimos o WhatsApp com o resumo do seu pedido. É só enviar a mensagem para a Look Show e combinar pagamento e
          entrega com a gente.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href={sentUrl}
            target="_blank"
            rel="noreferrer"
            data-testid="checkout-reopen-whatsapp"
            className="flex h-12 items-center justify-center gap-2 rounded-full bg-whatsapp px-7 font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
          >
            <MessageCircle className="size-5" /> Abrir WhatsApp novamente
          </a>
          <Link
            to="/"
            data-testid="checkout-back-home"
            className="flex h-12 items-center justify-center rounded-full border border-neutral-300 px-7 font-semibold transition-colors duration-200 hover:border-ink"
          >
            Voltar à loja
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center" data-testid="checkout-empty">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-wine-subtle">
          <ShoppingBag className="size-7 text-wine" />
        </span>
        <h1 className="mt-5 font-heading text-3xl font-bold">Sua sacola está vazia</h1>
        <p className="mt-2 text-neutral-500">Adicione produtos para finalizar o pedido.</p>
        <Link
          to="/produtos"
          data-testid="checkout-empty-shop-link"
          className="mt-7 inline-flex h-12 items-center rounded-full bg-wine px-7 font-semibold text-white"
        >
          Ver produtos
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-8 pt-6 md:px-8 md:pt-10" data-testid="checkout-page">
      <Link to="/produtos" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-ink" data-testid="checkout-back-link">
        <ChevronLeft className="size-4" /> Continuar comprando
      </Link>
      <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight md:text-5xl">Finalizar pedido</h1>
      <p className="mt-2 text-sm text-neutral-500">Preencha seus dados e envie o pedido direto para o nosso WhatsApp.</p>

      <form onSubmit={submit} noValidate className="mt-8 grid gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="space-y-8 lg:col-span-7">
          <section className="rounded-3xl bg-white p-5 ring-1 ring-neutral-200/80 md:p-7">
            <h2 className="flex items-center gap-3 font-heading text-lg font-bold">
              <span className="flex size-7 items-center justify-center rounded-full bg-ink text-xs text-white">1</span>
              Seus dados
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field id="checkout-name" label="Nome completo *" error={errors.name} className="sm:col-span-2">
                <Input
                  id="checkout-name"
                  data-testid="checkout-name-input"
                  value={d.name}
                  onChange={(e) => set("name", e.target.value)}
                  autoComplete="name"
                  className={inputCls}
                  placeholder="Como devemos te chamar?"
                />
              </Field>
              <Field id="checkout-phone" label="WhatsApp (opcional)" className="sm:col-span-2">
                <Input
                  id="checkout-phone"
                  data-testid="checkout-phone-input"
                  value={d.phone}
                  onChange={(e) => set("phone", formatPhone(e.target.value))}
                  inputMode="tel"
                  autoComplete="tel"
                  className={inputCls}
                  placeholder="(11) 99999-9999"
                />
              </Field>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-5 ring-1 ring-neutral-200/80 md:p-7">
            <h2 className="flex items-center gap-3 font-heading text-lg font-bold">
              <span className="flex size-7 items-center justify-center rounded-full bg-ink text-xs text-white">2</span>
              Forma de envio
            </h2>
            <div className="mt-5 grid gap-3" role="radiogroup">
              {SHIPPING_OPTIONS.map((s) => {
                const on = d.shipping === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => set("shipping", s.id as ShippingId)}
                    data-testid={`checkout-shipping-${s.id}`}
                    className={cn(
                      "flex items-center gap-4 rounded-2xl border p-4 text-left transition-[border-color,background-color] duration-200",
                      on ? "border-wine bg-wine-subtle" : "border-neutral-200 hover:border-neutral-400",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                        on ? "border-wine" : "border-neutral-300",
                      )}
                    >
                      {on && <span className="size-2.5 rounded-full bg-wine" />}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">{s.label}</span>
                      <span className="block text-xs text-neutral-500">{s.desc}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {delivery && (
            <section className="rounded-3xl bg-white p-5 ring-1 ring-neutral-200/80 animate-fade-up md:p-7">
              <h2 className="flex items-center gap-3 font-heading text-lg font-bold">
                <span className="flex size-7 items-center justify-center rounded-full bg-ink text-xs text-white">3</span>
                Endereço de entrega
              </h2>
              <div className="mt-5 grid grid-cols-6 gap-4">
                <Field id="checkout-cep" label="CEP *" error={errors.cep} className="col-span-6 sm:col-span-3">
                  <div className="relative">
                    <Input
                      id="checkout-cep"
                      data-testid="checkout-cep-input"
                      value={d.cep}
                      onChange={(e) => {
                        const v = formatCep(e.target.value);
                        set("cep", v);
                        if (v.replace(/\D/g, "").length === 8) void lookupCep(v);
                      }}
                      inputMode="numeric"
                      autoComplete="postal-code"
                      className={inputCls}
                      placeholder="00000-000"
                    />
                    {cepLoading && (
                      <Loader2 className="absolute right-4 top-1/2 size-4 -translate-y-1/2 animate-spin text-wine" />
                    )}
                  </div>
                </Field>
                <Field id="checkout-street" label="Rua / Avenida *" error={errors.street} className="col-span-6 sm:col-span-4">
                  <Input
                    id="checkout-street"
                    data-testid="checkout-address-input"
                    value={d.street}
                    onChange={(e) => set("street", e.target.value)}
                    autoComplete="address-line1"
                    className={inputCls}
                  />
                </Field>
                <Field id="checkout-number" label="Número *" error={errors.number} className="col-span-2 sm:col-span-2">
                  <Input
                    id="checkout-number"
                    data-testid="checkout-number-input"
                    value={d.number}
                    onChange={(e) => set("number", e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field id="checkout-complement" label="Complemento" className="col-span-4 sm:col-span-3">
                  <Input
                    id="checkout-complement"
                    data-testid="checkout-complement-input"
                    value={d.complement}
                    onChange={(e) => set("complement", e.target.value)}
                    className={inputCls}
                    placeholder="Apto, bloco…"
                  />
                </Field>
                <Field id="checkout-neighborhood" label="Bairro *" error={errors.neighborhood} className="col-span-6 sm:col-span-3">
                  <Input
                    id="checkout-neighborhood"
                    data-testid="checkout-neighborhood-input"
                    value={d.neighborhood}
                    onChange={(e) => set("neighborhood", e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field id="checkout-city" label="Cidade *" error={errors.city} className="col-span-4 sm:col-span-4">
                  <Input
                    id="checkout-city"
                    data-testid="checkout-city-input"
                    value={d.city}
                    onChange={(e) => set("city", e.target.value)}
                    autoComplete="address-level2"
                    className={inputCls}
                  />
                </Field>
                <Field id="checkout-state" label="UF *" error={errors.state} className="col-span-2 sm:col-span-2">
                  <Input
                    id="checkout-state"
                    data-testid="checkout-state-input"
                    value={d.state}
                    maxLength={2}
                    onChange={(e) => set("state", e.target.value.toUpperCase())}
                    className={cn(inputCls, "uppercase")}
                    placeholder="SP"
                  />
                </Field>
              </div>
            </section>
          )}

          <section className="rounded-3xl bg-white p-5 ring-1 ring-neutral-200/80 md:p-7">
            <Field id="checkout-notes" label="Observações (opcional)">
              <Textarea
                id="checkout-notes"
                data-testid="checkout-notes-input"
                value={d.notes}
                onChange={(e) => set("notes", e.target.value)}
                className="min-h-24 rounded-xl border-neutral-300 bg-white px-4 py-3 text-base md:text-sm"
                placeholder="Alguma preferência de horário, presente, etc."
              />
            </Field>
          </section>
        </div>

        <aside className="lg:col-span-5">
          <div className="rounded-3xl bg-white p-5 ring-1 ring-neutral-200/80 md:p-7 lg:sticky lg:top-32" data-testid="checkout-summary">
            <h2 className="font-heading text-lg font-bold">Resumo do pedido</h2>
            <ul className="mt-4 max-h-80 divide-y divide-neutral-100 overflow-y-auto">
              {items.map((i) => (
                <li key={i.key} className="flex gap-3 py-3" data-testid="checkout-summary-item">
                  <SafeImage src={i.image} alt={i.name} className="h-20 w-[60px] shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-semibold">{i.name}</p>
                    <p className="text-xs text-neutral-500">
                      Tam: {i.size} · Cor: {i.color}
                    </p>
                    <p className="text-xs text-neutral-500">Qtd: {i.quantity}</p>
                  </div>
                  <span className="text-sm font-semibold">{formatBRL(i.price * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-2 border-t border-neutral-100 pt-4 text-sm">
              <div className="flex justify-between text-neutral-600">
                <span>Envio</span>
                <span>{SHIPPING_OPTIONS.find((s) => s.id === d.shipping)?.label}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="font-semibold">Subtotal</span>
                <span className="font-heading text-2xl font-bold text-wine" data-testid="checkout-subtotal">
                  {formatBRL(subtotal)}
                </span>
              </div>
            </div>
            <button
              type="submit"
              data-testid="checkout-submit-button"
              className="mt-6 flex h-14 w-full items-center justify-center gap-2.5 rounded-full bg-whatsapp text-base font-bold text-white shadow-lg shadow-whatsapp/25 transition-[transform,filter] duration-200 hover:brightness-95 active:scale-[0.98]"
            >
              <MessageCircle className="size-5" /> Finalizar Pedido no WhatsApp
            </button>
            <p className="mt-3 text-center text-xs leading-relaxed text-neutral-500">
              Você será direcionada ao WhatsApp da loja com o resumo do pedido. Pagamento e frete são combinados por lá.
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
