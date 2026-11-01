const MESSAGES = [
  "Envio para todo o Brasil",
  "Primeira troca grátis",
  "Atendimento personalizado",
  "Finalize seu pedido direto pelo WhatsApp",
];

export function Marquee() {
  const row = [...MESSAGES, ...MESSAGES, ...MESSAGES, ...MESSAGES];
  return (
    <div className="overflow-hidden bg-wine py-2 text-white">
      <div className="flex w-max animate-marquee items-center whitespace-nowrap">
        {[0, 1].map((n) => (
          <div key={n} className="flex items-center" aria-hidden={n === 1}>
            {row.map((m, i) => (
              <span key={i} className="flex items-center text-[10px] font-medium uppercase tracking-[0.14em]">
                <span className="px-7">{m}</span>
                <span className="text-[6px] opacity-80">●</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
