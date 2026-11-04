import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { api } from '@/lib/api';

function renderAt(path: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('admin routes', () => {
  afterEach(() => cleanup());
  beforeEach(() => vi.restoreAllMocks());

  it('renders the key-only login form without persisting the key', () => {
    renderAt('/login');

    expect(screen.getByRole('heading', { name: 'Entrar no painel' })).toBeVisible();
    expect(screen.getByLabelText('Chave de acesso')).toHaveAttribute('type', 'password');
  });

  it('redirects an unauthenticated route to login after a 401 session check', async () => {
    vi.spyOn(api, 'get').mockRejectedValueOnce(
      Object.assign(new Error('unauthorized'), {
        isAxiosError: true,
        response: { status: 401 },
      }),
    );

    renderAt('/produtos');

    expect(await screen.findByRole('heading', { name: 'Entrar no painel' })).toBeVisible();
  });

  it('keeps the session error visible when the API cannot be reached', async () => {
    vi.spyOn(api, 'get').mockRejectedValueOnce(new Error('offline'));

    renderAt('/produtos');

    expect(
      await screen.findByRole('heading', { name: 'Não foi possível validar o acesso.' }),
    ).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Entrar no painel' })).not.toBeInTheDocument();
  });

  it('does not treat an invalid product id as a new product', async () => {
    vi.spyOn(api, 'get').mockImplementation(
      (async (url: string) => ({
        data:
          url === '/auth/admin/me'
            ? { authenticated: true }
            : url === '/categories'
              ? []
              : {
                  name: 'Camiseta',
                  slug: 'camiseta',
                  description: 'Algodão',
                  price: 1000,
                  categoryId: 1,
                  status: 'DRAFT',
                  images: [],
                  variants: [],
                },
      })) as never,
    );

    renderAt('/produtos/not-a-number/editar');

    expect(await screen.findByRole('heading', { name: 'ID de produto inválido.' })).toBeVisible();
  });

  it('asks for confirmation before archiving an edited product', async () => {
    vi.spyOn(api, 'get').mockImplementation(
      (async (url: string) => ({
        data:
          url === '/auth/admin/me'
            ? { authenticated: true }
            : url === '/categories'
              ? []
              : {
                  id: 3,
                  name: 'Camiseta',
                  slug: 'camiseta',
                  description: 'Algodão',
                  price: 1000,
                  categoryId: 1,
                  status: 'ACTIVE',
                  images: ['https://example.com/image.jpg'],
                  variants: [{ sku: 'CAM-M', size: 'M', color: 'Preto', stock: 2, available: true }],
                },
      })) as never,
    );
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const updateProduct = vi.spyOn(api, 'put');

    renderAt('/produtos/3/editar');
    const saveButton = await screen.findByRole('button', { name: 'Salvar alterações' });
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'ARCHIVED' } });
    fireEvent.submit(saveButton.closest('form')!);

    expect(confirm).toHaveBeenCalledWith('Deseja arquivar “Camiseta”?');
    expect(updateProduct).not.toHaveBeenCalled();
  });
});
