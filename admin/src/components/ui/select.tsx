import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="relative inline-flex w-full">
      <select
        className={cn(
          'min-h-10 w-full appearance-none rounded-lg border border-input bg-white py-2 pl-3 pr-9 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine disabled:opacity-50',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </span>
  );
}
