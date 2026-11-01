import { Link } from "react-router";
import { ArrowRight } from "lucide-react";

export function SectionHeading({ eyebrow, title, to }: { eyebrow: string; title: string; to: string }) {
  return (
    <div className="flex items-end justify-between">
      <div>
        <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-wine">{eyebrow}</p>
        <h2 className="mt-1 text-[26px] font-bold leading-none">{title}</h2>
      </div>
      <Link to={to} className="group flex items-center gap-1 text-[11px] font-medium">
        Ver tudo <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}
