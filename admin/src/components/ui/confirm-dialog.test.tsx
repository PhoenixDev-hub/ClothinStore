import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from './confirm-dialog';

describe('ConfirmDialog', () => {
  afterEach(() => cleanup());

  it('renders an accessible dialog and calls the chosen action', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmDialog
        open
        title="Excluir produto?"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        tone="danger"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    expect(screen.getByRole('dialog', { name: 'Excluir produto?' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    expect(onConfirm).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalled();
  });
});
