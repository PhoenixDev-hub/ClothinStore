import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ImportProducts from './ImportProducts';
import { api } from '@/lib/api';

describe('ImportProducts', () => {
  afterEach(() => cleanup());
  beforeEach(() => vi.restoreAllMocks());

  it('uploads a CSV and shows the import report with errors per line', async () => {
    const upload = vi.spyOn(api, 'post').mockResolvedValue({
      data: {
        criados: 1,
        erros: [{ linha: 3, motivo: 'Categoria "Inexistente" não encontrada' }],
      },
    } as never);
    const onImported = vi.fn();

    render(<ImportProducts onImported={onImported} />);

    const file = new File(['nome\n'], 'produtos.csv', { type: 'text/csv' });
    fireEvent.change(screen.getByLabelText('Arquivo CSV'), {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Importar produtos' }));

    await waitFor(() =>
      expect(upload).toHaveBeenCalledWith('/admin/products/import', expect.any(FormData)),
    );
    expect(await screen.findByText('1 criados, 1 erros')).toBeVisible();
    expect(screen.getByText('Linha 3: Categoria "Inexistente" não encontrada')).toBeVisible();
    expect(onImported).toHaveBeenCalled();
  });

  it('offers the example CSV for download', () => {
    render(<ImportProducts />);

    expect(screen.getByRole('link', { name: /Baixar exemplo CSV/i })).toHaveAttribute(
      'href',
      '/products-example.csv',
    );
  });
});
