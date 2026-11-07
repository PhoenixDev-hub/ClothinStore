import { useId } from 'react';
import { Button } from './button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  pending?: boolean;
  tone?: 'primary' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  pending = false,
  tone = 'primary',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
      >
        <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
        {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
        <div className="mt-5 flex flex-col-reverse justify-end gap-2 sm:flex-row">
          <Button variant="secondary" onClick={onCancel} disabled={pending}>Cancelar</Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            className={tone === 'danger' ? 'bg-destructive text-white hover:bg-destructive/90' : undefined}
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? 'Aguarde…' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
