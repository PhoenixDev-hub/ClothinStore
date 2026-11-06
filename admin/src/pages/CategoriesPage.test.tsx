import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CategoriesPage from './CategoriesPage';
import { api } from '@/lib/api';

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <CategoriesPage />
    </QueryClientProvider>,
  );
}

describe('CategoriesPage image field', () => {
  afterEach(() => cleanup());
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, 'get').mockResolvedValue({ data: [] } as never);
  });

  it('uploads a chosen image and shows its preview', async () => {
    const upload = vi
      .spyOn(api, 'post')
      .mockResolvedValue({ data: { url: 'https://cdn.example.com/category.png' } } as never);

    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Nova categoria' }));

    const file = new File(['png'], 'category.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText(/escolher imagem/i), {
      target: { files: [file] },
    });

    await waitFor(() =>
      expect(upload).toHaveBeenCalledWith('/admin/categories/upload', expect.any(FormData)),
    );
    expect(await screen.findByAltText('Imagem da categoria')).toHaveAttribute(
      'src',
      'https://cdn.example.com/category.png',
    );
  });

  it('accepts a manually pasted image URL', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Nova categoria' }));
    fireEvent.click(screen.getByRole('button', { name: 'Colar URL manualmente' }));

    fireEvent.change(screen.getByLabelText('URL da imagem'), {
      target: { value: 'https://example.com/manual.png' },
    });

    expect(screen.getByAltText('Imagem da categoria')).toHaveAttribute(
      'src',
      'https://example.com/manual.png',
    );
  });
});
