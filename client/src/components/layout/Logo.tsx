import { Link } from "react-router";
import { cn } from "@/lib/utils";

export function Logo({ className, dotClass = "text-wine" }: { className?: string; dotClass?: string }) {
  return (
    <Link to="/" aria-label="Look Show" className={cn("font-display text-[22px] leading-none tracking-tight", className)}>
      <span className="font-extrabold">LOOK</span>
      <span className="font-light"> SHOW</span>
      <span className={cn("font-extrabold", dotClass)}>.</span>
    </Link>
  );
}
