import { cn } from "@/lib/utils";

export function Swatch({ hex, className }: { hex: string; className?: string }) {
  const light = ["#ffffff", "#f0ebe3"].includes(hex.toLowerCase());
  return (
    <span
      className={cn("inline-block size-2 rounded-full", light && "ring-1 ring-inset ring-black/15", className)}
      style={{ background: hex }}
    />
  );
}
