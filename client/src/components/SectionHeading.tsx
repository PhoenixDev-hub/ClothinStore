import { Link } from "react-router";
import { ArrowRight } from "lucide-react";

export function SectionHeading({ title, to }: { title: string; to: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <h2 className="text-2xl font-bold leading-tight sm:text-3xl">{title}</h2>
      <Link
        to={to}
        className="group inline-flex min-h-11 items-center gap-1.5 text-sm font-medium transition-colors duration-200 hover:text-wine"
      >
        Ver tudo <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}
