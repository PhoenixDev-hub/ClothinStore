import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Boxes,
  Layers3,
  LogOut,
  Shirt,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import {
  Link,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, apiErrorMessage, isUnauthorizedError } from '@/lib/api';
import type { AdminSession } from '@/types/api';
import CategoriesPage from '@/pages/CategoriesPage';
import ProductEditorPage from '@/pages/ProductEditorPage';
import ProductsPage from '@/pages/ProductsPage';

function SessionBoundary() {
  const location = useLocation();
  const { data, isPending, error, refetch } = useQuery<AdminSession>({
    queryKey: ['admin-session'],
    queryFn: async () => (await api.get<AdminSession>('/auth/admin/me')).data,
  });

  if (isPending) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Verificando acesso…
      </div>
    );
  }

  if (error && !isUnauthorizedError(error)) {
    return (
      <div className="grid min-h-screen place-items-center px-6 text-center">
        <div>
          <h1 className="text-xl font-semibold">Não foi possível validar o acesso.</h1>
          <p className="mt-2 text-sm text-muted-foreground">Confira a conexão com a API e tente novamente.</p>
          <Button variant="secondary" className="mt-4" onClick={() => void refetch()}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  if (isUnauthorizedError(error) || !data?.authenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

function AppShell() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    try {
      await api.post('/auth/admin/logout');
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      queryClient.clear();
      navigate('/login', { replace: true });
      setLoggingOut(false);
    }
  }

  return (
    <div className="min-h-screen md:flex">
      <aside className="flex shrink-0 flex-col bg-[#171414] text-white md:sticky md:top-0 md:h-screen md:w-60">
        <Link
          to="/produtos"
          className="flex h-[76px] items-center gap-3 border-b border-white/10 px-6 text-white no-underline"
        >
          <span className="grid size-9 place-items-center rounded-lg bg-wine text-white">
            <Shirt aria-hidden="true" className="size-5" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            LOOK <span className="font-light">SHOW</span>
            <span className="text-rose">.</span>
          </span>
        </Link>

        <nav aria-label="Navegação principal" className="flex gap-1 p-3 md:flex-1 md:flex-col md:py-5">
          <NavLink
            to="/produtos"
            className={({ isActive }) =>
              `flex min-h-10 flex-1 items-center gap-3 rounded-lg px-3 text-sm no-underline transition-colors md:flex-none ${isActive ? 'bg-white/10 font-semibold text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`
            }
          >
            <Boxes aria-hidden="true" className="size-4" /> Produtos
          </NavLink>
          <NavLink
            to="/categorias"
            className={({ isActive }) =>
              `flex min-h-10 flex-1 items-center gap-3 rounded-lg px-3 text-sm no-underline transition-colors md:flex-none ${isActive ? 'bg-white/10 font-semibold text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`
            }
          >
            <Layers3 aria-hidden="true" className="size-4" /> Categorias
          </NavLink>
        </nav>

        <div className="hidden border-t border-white/10 p-3 md:block">
          <Button
            variant="ghost"
            className="w-full justify-start text-white/70 hover:bg-white/10 hover:text-white"
            onClick={logout}
            disabled={loggingOut}
          >
            <LogOut aria-hidden="true" className="size-4" />
            {loggingOut ? 'Saindo…' : 'Sair'}
          </Button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="flex min-h-[76px] items-center justify-between border-b border-border bg-white px-5 sm:px-8">
          <p className="text-sm text-muted-foreground">Painel administrativo</p>
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={logout}
            disabled={loggingOut}
          >
            <LogOut aria-hidden="true" className="size-4" /> Sair
          </Button>
        </header>
        <div className="mx-auto w-full max-w-[1440px] px-5 py-7 sm:px-8 sm:py-9">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function LoginRoute() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setSubmitting(true);
    try {
      await api.post('/auth/admin', { apiKey });
      queryClient.setQueryData(['admin-session'], { authenticated: true });
      setApiKey('');
      navigate('/produtos', { replace: true });
    } catch (error) {
      setErrorMessage(
        errorMessageForLogin(error),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1fr_1fr]">
      <section className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-[#171414] p-12 text-white lg:flex xl:p-16">
        <Link to="/login" className="font-display text-xl font-semibold tracking-tight text-white no-underline">
          LOOK <span className="font-light">SHOW</span><span className="text-rose">.</span>
        </Link>
        <div className="relative z-10 max-w-lg pb-8">
          <span className="mb-8 block h-1 w-14 bg-wine" />
          <h1 className="max-w-md text-5xl font-semibold leading-[1.05] xl:text-6xl">
            Seu catálogo, em boas mãos.
          </h1>
          <p className="mt-5 max-w-sm text-base leading-7 text-white/65">
            Produtos, categorias e estoque em um só lugar.
          </p>
        </div>
        <p className="text-xs text-white/45">Look Show · Administração</p>
        <div aria-hidden="true" className="absolute -bottom-20 -right-16 size-[390px] rounded-full border border-white/10" />
        <div aria-hidden="true" className="absolute -bottom-4 -right-2 size-[250px] rounded-full border border-white/10" />
      </section>

      <section className="grid min-h-screen place-items-center px-6 py-12">
        <div className="w-full max-w-[390px]">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <span className="grid size-10 place-items-center rounded-lg bg-wine text-white">
              <Shirt aria-hidden="true" className="size-5" />
            </span>
            <span className="font-display text-lg font-semibold">LOOK SHOW<span className="text-wine">.</span></span>
          </div>
          <h2 className="text-3xl font-semibold">Entrar no painel</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Informe sua chave de acesso administrativo.
          </p>

          <form className="mt-8 grid gap-5" onSubmit={submit}>
            <label className="field-label" htmlFor="admin-key">
              Chave de acesso
              <Input
                id="admin-key"
                type="password"
                autoComplete="current-password"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                required
                autoFocus
                aria-describedby={errorMessage ? 'login-error' : undefined}
              />
            </label>
            {errorMessage && (
              <p id="login-error" role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-destructive">
                {errorMessage}
              </p>
            )}
            <Button type="submit" className="mt-1 w-full" disabled={submitting || !apiKey}>
              {submitting ? 'Validando…' : 'Entrar'}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}

function errorMessageForLogin(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { status?: number } }).response;
    if (response?.status === 401) return 'Chave inválida. Confira e tente novamente.';
    if (response?.status === 429) return 'Muitas tentativas. Aguarde um minuto e tente novamente.';
  }
  return 'Não foi possível validar a chave. Verifique a conexão e tente novamente.';
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route element={<SessionBoundary />}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/produtos" replace />} />
          <Route path="produtos" element={<ProductsPage />} />
          <Route path="produtos/novo" element={<ProductEditorPage />} />
          <Route path="produtos/:id/editar" element={<ProductEditorPage />} />
          <Route path="categorias" element={<CategoriesPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/produtos" replace />} />
    </Routes>
  );
}
