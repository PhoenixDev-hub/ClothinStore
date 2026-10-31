import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ExternalLink,
  Loader2,
  Lock,
  LogOut,
  MessageCircle,
  Package,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ProductForm from "@/components/admin/ProductForm";
import SafeImage from "@/components/store/SafeImage";
import { apiDelete, apiGet, apiPost, apiPut, ApiError } from "@/lib/api";
import { beginSession, endSession } from "@/lib/session";
import { categoryLabel, formatBRL } from "@/lib/store";
import type { AdminStats, AdminStatus, DemoActionResult, Product, StoreSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

function AdminLogin() {
  const qc = useQueryClient();
  const [password, setPassword] = useState("");
  const login = useMutation({
    mutationFn: () => apiPost<AdminStatus>("/admin/login", { password }),
    onSuccess: (s) => {
      beginSession();
      qc.setQueryData(["admin", "me"], s);
    },
    onError: (e) => toast.error(e instanceof ApiError && e.status === 401 ? "Senha incorreta" : "Erro ao entrar"),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (password) login.mutate();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4" data-testid="admin-login-page">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-[28px] bg-white p-8 shadow-2xl animate-fade-up"
        data-testid="admin-login-form"
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-wine-subtle">
          <Lock className="size-5 text-wine" />
        </span>
        <h1 className="mt-5 font-heading text-2xl font-bold">Painel Look Show</h1>
        <p className="mt-1 text-sm text-neutral-500">Área restrita. Digite a senha de administradora.</p>
        <Input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
          data-testid="admin-login-password"
          className="mt-6 h-12 rounded-xl border-neutral-300"
        />
        <button
          type="submit"
          disabled={login.isPending}
          data-testid="admin-login-submit"
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-wine font-semibold text-white transition-[background-color,transform] duration-200 hover:bg-wine-hover active:scale-[0.98] disabled:opacity-60"
        >
          {login.isPending && <Loader2 className="size-4 animate-spin" />}
          Entrar
        </button>
        <Link to="/" className="mt-5 block text-center text-xs text-neutral-500 hover:text-ink" data-testid="admin-login-back">
          ← Voltar para a loja
        </Link>
      </form>
    </div>
  );
}

function SettingsCard() {
  const qc = useQueryClient();
  const settings = useQuery({ queryKey: ["settings"], queryFn: () => apiGet<StoreSettings>("/settings") });
  const [value, setValue] = useState<string | null>(null);
  const current = value ?? settings.data?.whatsapp_number ?? "";
  const save = useMutation({
    mutationFn: () => apiPut<StoreSettings>("/admin/settings", { whatsapp_number: current.replace(/\D/g, "") }),
    onSuccess: (s) => {
      qc.setQueryData(["settings"], s);
      setValue(null);
      toast.success("WhatsApp da loja atualizado");
    },
    onError: () => toast.error("Número inválido. Use 55 + DDD + número (ex: 5511999999999)"),
  });

  return (
    <div className="rounded-3xl bg-white p-5 ring-1 ring-neutral-200/80 md:p-6" data-testid="admin-settings-card">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-full bg-whatsapp/15">
          <MessageCircle className="size-5 text-whatsapp" />
        </span>
        <div>
          <p className="font-heading font-bold">WhatsApp da loja</p>
          <p className="text-xs text-neutral-500">Para onde os pedidos são enviados</p>
        </div>
      </div>
      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <Input
          value={current}
          onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
          inputMode="numeric"
          placeholder="5511999999999"
          data-testid="admin-whatsapp-input"
          className="h-11 rounded-full border-neutral-300"
        />
        <button
          type="submit"
          disabled={save.isPending}
          data-testid="admin-whatsapp-save"
          className="h-11 shrink-0 rounded-full bg-ink px-5 text-sm font-semibold text-white hover:bg-wine disabled:opacity-60"
        >
          Salvar
        </button>
      </form>
      <p className="mt-2 text-[11px] text-neutral-400">Formato: 55 + DDD + número, só dígitos.</p>
    </div>
  );
}

function Dashboard() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const [confirmDemo, setConfirmDemo] = useState(false);

  const products = useQuery({
    queryKey: ["products", "admin-list"],
    queryFn: () => apiGet<Product[]>("/products?limit=500"),
  });
  const stats = useQuery({ queryKey: ["admin", "stats"], queryFn: () => apiGet<AdminStats>("/admin/stats") });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["products"] });
    qc.invalidateQueries({ queryKey: ["admin", "stats"] });
  };

  const del = useMutation({
    mutationFn: (id: string) => apiDelete<DemoActionResult>(`/admin/products/${id}`),
    onSuccess: () => {
      toast.success("Produto excluído");
      setToDelete(null);
      refresh();
    },
    onError: () => toast.error("Não foi possível excluir"),
  });
  const clearDemo = useMutation({
    mutationFn: () => apiDelete<DemoActionResult>("/admin/demo"),
    onSuccess: (r) => {
      toast.success(`${r.deleted} produtos de teste apagados`);
      setConfirmDemo(false);
      refresh();
    },
  });
  const restoreDemo = useMutation({
    mutationFn: () => apiPost<DemoActionResult>("/admin/demo/restore"),
    onSuccess: (r) => {
      toast.success(`${r.inserted} produtos de teste restaurados`);
      refresh();
    },
  });

  const list = (products.data ?? []).filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase()));

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const statCards = [
    { label: "Produtos", value: stats.data?.total_products, testId: "admin-stat-total" },
    { label: "De teste", value: stats.data?.demo_products, testId: "admin-stat-demo" },
    { label: "Estoque baixo", value: stats.data?.low_stock, testId: "admin-stat-low" },
    { label: "Esgotados", value: stats.data?.out_of_stock, testId: "admin-stat-out" },
  ];

  return (
    <div className="min-h-screen bg-neutral-50" data-testid="admin-dashboard">
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 md:px-8">
          <p className="font-heading text-lg font-black uppercase tracking-tight">
            Look <span className="ml-1 font-light">Show</span>
          </p>
          <span className="rounded-full bg-wine px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">Admin</span>
          <div className="ml-auto flex items-center gap-1">
            <Link
              to="/"
              target="_blank"
              data-testid="admin-view-store"
              className="flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
            >
              <ExternalLink className="size-4" /> <span className="hidden sm:inline">Ver loja</span>
            </Link>
            <button
              type="button"
              onClick={() => void endSession("/admin")}
              data-testid="admin-logout"
              className="flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
            >
              <LogOut className="size-4" /> <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">Catálogo</h1>
            <p className="mt-1 text-sm text-neutral-500">Cadastre, edite e organize os produtos da loja.</p>
          </div>
          <button
            type="button"
            onClick={openNew}
            data-testid="admin-new-product"
            className="flex h-11 items-center gap-2 rounded-full bg-wine px-5 text-sm font-semibold text-white shadow-lg shadow-wine/20 transition-[background-color,transform] duration-200 hover:bg-wine-hover active:scale-[0.98]"
          >
            <Plus className="size-4" /> Novo produto
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {statCards.map((s) => (
            <div key={s.label} className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200/80">
              <p className="text-xs font-medium text-neutral-500">{s.label}</p>
              <p className="mt-1 font-heading text-3xl font-bold" data-testid={s.testId}>
                {s.value ?? "–"}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <SettingsCard />
          <div className="rounded-3xl bg-white p-5 ring-1 ring-neutral-200/80 md:p-6" data-testid="admin-demo-card">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-amber-100">
                <AlertTriangle className="size-5 text-amber-600" />
              </span>
              <div>
                <p className="font-heading font-bold">Dados de teste</p>
                <p className="text-xs text-neutral-500">
                  {stats.data?.demo_products ?? 0} produtos de demonstração no catálogo
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setConfirmDemo(true)}
                disabled={!stats.data?.demo_products}
                data-testid="admin-clear-demo"
                className="flex h-11 items-center gap-2 rounded-full bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40"
              >
                <Trash2 className="size-4" /> Apagar dados de teste
              </button>
              <button
                type="button"
                onClick={() => restoreDemo.mutate()}
                disabled={restoreDemo.isPending}
                data-testid="admin-restore-demo"
                className="flex h-11 items-center gap-2 rounded-full border border-neutral-300 px-5 text-sm font-semibold hover:border-ink disabled:opacity-50"
              >
                <RotateCcw className="size-4" /> Restaurar demonstração
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-3xl bg-white ring-1 ring-neutral-200/80">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 p-4 md:px-6">
            <p className="font-heading font-bold">
              Produtos <span className="font-normal text-neutral-400">({list.length})</span>
            </p>
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome"
                data-testid="admin-search"
                className="h-10 rounded-full border-neutral-300 pl-9"
              />
            </div>
          </div>

          {products.isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="size-6 animate-spin text-wine" />
            </div>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center" data-testid="admin-products-empty">
              <Package className="size-10 text-neutral-300" strokeWidth={1.5} />
              <p className="text-sm text-neutral-500">Nenhum produto. Clique em “Novo produto” para cadastrar.</p>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100" data-testid="admin-product-list">
              {list.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-4 py-3 md:gap-4 md:px-6" data-testid={`admin-product-row-${p.id}`}>
                  <SafeImage src={p.images[0]} alt={p.name} className="h-16 w-12 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="truncate text-sm font-semibold" data-testid={`admin-product-name-${p.id}`}>
                        {p.name}
                      </p>
                      {p.is_demo && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase text-amber-700">Teste</span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500">
                      {categoryLabel(p.category)} · {p.sizes.join(", ")}
                    </p>
                    <p className="mt-0.5 text-xs md:hidden">
                      <span className="font-semibold text-wine">{formatBRL(p.price)}</span> · Estoque {p.stock}
                    </p>
                  </div>
                  <span className="hidden w-28 text-right text-sm font-semibold text-wine md:block">{formatBRL(p.price)}</span>
                  <span
                    className={cn(
                      "hidden w-24 text-center text-xs font-semibold md:block",
                      p.stock === 0 ? "text-red-600" : p.stock <= 5 ? "text-amber-600" : "text-neutral-600",
                    )}
                  >
                    {p.stock === 0 ? "Esgotado" : `${p.stock} un.`}
                  </span>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      aria-label="Editar"
                      onClick={() => {
                        setEditing(p);
                        setFormOpen(true);
                      }}
                      data-testid={`admin-edit-${p.id}`}
                      className="flex size-9 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100 hover:text-ink"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Excluir"
                      onClick={() => setToDelete(p)}
                      data-testid={`admin-delete-${p.id}`}
                      className="flex size-9 items-center justify-center rounded-full text-neutral-600 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent
          side="right"
          className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl"
          data-testid="product-form-sheet"
        >
          <div className="border-b border-neutral-100 px-5 py-4 md:px-6">
            <SheetTitle className="font-heading text-lg font-bold">{editing ? "Editar produto" : "Novo produto"}</SheetTitle>
          </div>
          {formOpen && <ProductForm key={editing?.id ?? "new"} initial={editing} onDone={() => setFormOpen(false)} />}
        </SheetContent>
      </Sheet>

      <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent data-testid="admin-delete-dialog">
          <DialogHeader>
            <DialogTitle>Excluir produto?</DialogTitle>
            <DialogDescription>“{toDelete?.name}” será removido da loja. Essa ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setToDelete(null)}
              data-testid="admin-delete-cancel"
              className="h-10 rounded-full border border-neutral-300 px-5 text-sm font-semibold"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => toDelete && del.mutate(toDelete.id)}
              disabled={del.isPending}
              data-testid="admin-delete-confirm"
              className="h-10 rounded-full bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700"
            >
              Excluir
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDemo} onOpenChange={setConfirmDemo}>
        <DialogContent data-testid="admin-clear-demo-dialog">
          <DialogHeader>
            <DialogTitle>Apagar dados de teste?</DialogTitle>
            <DialogDescription>
              Os {stats.data?.demo_products ?? 0} produtos de demonstração serão removidos. Produtos que você cadastrou não serão afetados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setConfirmDemo(false)}
              data-testid="admin-clear-demo-cancel"
              className="h-10 rounded-full border border-neutral-300 px-5 text-sm font-semibold"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => clearDemo.mutate()}
              disabled={clearDemo.isPending}
              data-testid="admin-clear-demo-confirm"
              className="h-10 rounded-full bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700"
            >
              Apagar tudo
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Admin() {
  const me = useQuery({
    queryKey: ["admin", "me"],
    queryFn: () => apiGet<AdminStatus>("/admin/me"),
    retry: false,
  });

  if (me.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <Loader2 className="size-6 animate-spin text-white" />
      </div>
    );
  }
  return me.data?.authenticated ? <Dashboard /> : <AdminLogin />;
}
