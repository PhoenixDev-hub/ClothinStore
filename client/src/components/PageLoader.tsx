export function PageLoader() {
  return (
    <div className="container-shop grid min-h-[60vh] place-items-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3">
        <span className="size-8 animate-spin rounded-full border-2 border-wine/20 border-t-wine" />
        <span className="text-sm text-muted-foreground">Carregando página…</span>
      </div>
    </div>
  );
}
