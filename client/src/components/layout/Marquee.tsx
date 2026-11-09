const MESSAGES = [
  "Pode ser retirado na loja",
  "Envio para a localidade",
  "Primeira troca grátis",
  "Atendimento personalizado",
  "Finalize seu pedido direto pelo WhatsApp",
];

export function Marquee() {
  const row = [...MESSAGES, ...MESSAGES, ...MESSAGES, ...MESSAGES];
  return (
    <div className="overflow-hidden bg-wine py-2.5 text-white">
      <div className="flex w-max items-center whitespace-nowrap motion-safe:animate-marquee">
        {[0, 1].map((n) => (
          <div key={n} className="flex items-center" aria-hidden={n === 1}>
            {row.map((m, i) => (
              <span key={i} className="flex items-center text-sm font-medium">
                <span className="px-7">{m}</span>
                <span className="size-1 rounded-full bg-white/70" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
