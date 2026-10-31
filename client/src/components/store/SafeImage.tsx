import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  src?: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
  testId?: string;
}

// Never lets a broken URL collapse the grid: falls back to a neutral placeholder of the same box.
export default function SafeImage({ src, alt, className, loading = "lazy", testId }: Props) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div
        data-testid={testId}
        className={cn("flex items-center justify-center bg-neutral-100 text-neutral-400", className)}
        aria-label={alt}
      >
        <ImageOff className="size-8" strokeWidth={1.5} />
      </div>
    );
  }
  return (
    <img
      data-testid={testId}
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      onError={() => setFailed(true)}
      className={cn("object-cover", className)}
    />
  );
}
