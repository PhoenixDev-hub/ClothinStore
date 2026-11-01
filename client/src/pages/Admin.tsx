import { useMemo, useState } from "react";
import { Link } from "react-router";
import { AlertTriangle, ExternalLink, LogOut, MessageCircle, Pencil, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { useAuth } from "@/store/auth";
import { useClearDemo, useDeleteProduct, useProducts, useRestoreDemo, useSaveWhatsapp, useSettings } from "@/hooks/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { ProductFormSheet } from "@/components/admin/ProductFormSheet";
import { categoryLabel, formatBRL } from "@/lib/utils";
import type { Product } from "@/types";
import AdminLogin from "./AdminLogin";

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-border bg-white px-4 py-3">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-display text-[22px] font-bold leading-tight">{value}</p>
    </div>
  );
}

function Dashboard() {
  const logout = useAuth((s) => s.logout);
  const { data: products, isLoading } = useProducts({});
  const { data: settings } = useSettings();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const [wa, setWa] = useState<string>();

  const del = useDeleteProduct();
  const clearDemo = useClearDemo();
  const restoreDemo = useRestoreDemo();
  const saveWa = useSaveWhatsapp();

  const all = products ?? [];
  const demoCount = all.filter((p) => p.isDemo).length;
  const low = all.filter((p) => p.stock > 0 && p.stock <= 5).length;
  const out = all.filter((p) => p.stock <= 0).length;
  const filtered = useMemo(() => all.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())), [all, search]);
  const waValue = wa ?? settings?.whatsapp ?? "";

  const openForm = (p: Product | null) => {
    setEditing(p);
    setFormOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-white">
        <div className="container-shop flex h-[42px] items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="font-display text-[15px]">
              <span className="font-extrabold">LOOK</span>
              <span className="font-light"> SHOW</span>
            </Link>
            <span className="rounded-full bg-wine px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white">Admin</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
            <Link to="/" target="_blank" className="flex items-center gap-1.5 hover:text-foreground">
              <ExternalLink className="size-3" /> Ver loja
            </Link>
            <button onClick={logout} className="flex items-center gap-1.5 hover:text-foreground">
              <LogOut className="size-3" /> Sair
            </button>
          </div>
        </div>
      </header>

      <main className="container-shop pb-16 pt-9">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-bold leading-none">Catálogo</h1>
            <p className="mt-1.5 text-[11px] text-muted-foreground">Cadastre, edite e organize os produtos da loja.</p>
          </div>
          <Button onClick={() => openForm(null)} className="h-9 px-5 text-xs">
            <Plus /> Novo produto
          </Button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Produtos" value={all.length} />
          <Stat label="De teste" value={demoCount} />
          <Stat label="Estoque baixo" value={low} />
          <Stat label="Esgotados" value={out} />
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <form
            className="rounded-2xl border border-border bg-white p-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const digits = waValue.replace(/\D/g, "");
              if (digits.length < 12) return toast.error("Use o formato 55 + DDD + número (só dígitos).");
              await saveWa.mutateAsync(digits);
              setWa(undefined);
              toast.success("WhatsApp atualizado");
            }}
          >
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-full bg-green-50 text-green-600">
                <MessageCircle className="size-4" />
              </span>
              <div>
                <p className="text-xs font-semibold">WhatsApp da loja</p>
                <p className="text-[9px] text-muted-foreground">Para onde os pedidos são enviados</p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Input value={waValue} onChange={(e) => setWa(e.target.value)} inputMode="numeric" className="h-9 text-xs" />
              <Button type="submit" variant="dark" className="h-9 px-5 text-xs" disabled={saveWa.isPending}>
                Salvar
              </Button>
            </div>
            <p className="mt-2 text-[9px] text-muted-foreground">Formato: 55 + DDD + número, só dígitos.</p>
          </form>

          <div className="rounded-2xl border border-border bg-white p-4">
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-full bg-amber-50 text-amber-500">
                <AlertTriangle className="size-4" />
              </span>
              <div>
                <p className="text-xs font-semibold">Dados de teste</p>
                <p className="text-[9px] text-muted-foreground">{demoCount} produtos de demonstração no catálogo</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="destructive"
                className="h-9 px-4 text-xs"
                disabled={demoCount === 0 || clearDemo.isPending}
                onClick={async () => {
                  await clearDemo.mutateAsync();
                  toast.success("Dados de teste apagados");
                }}
              >
                <Trash2 /> Apagar dados de teste
              </Button>
              <Button
                variant="outline"
                className="h-9 px-4 text-xs"
                disabled={restoreDemo.isPending}
                onClick={async () => {
                  await restoreDemo.mutateAsync();
                  toast.success("Demonstração restaurada");
                }}
              >
                <RotateCcw /> Restaurar demonstração
              </Button>
            </div>
          </div>
        </div>

        <section className="mt-4 rounded-2xl border border-border bg-white">
          <div className="flex items-center justify-between gap-3 p-4">
            <h2 className="font-sans text-xs font-bold tracking-normal">
              Produtos <span className="font-normal text-muted-foreground">({filtered.length})</span>
            </h2>
            <div className="relative w-full max-w-[17rem]">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome" className="h-8 rounded-full pl-8 text-[11px]" />
            </div>
          </div>
          <ul>
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="flex items-center gap-3 border-t border-border px-4 py-3">
                  <Skeleton className="size-10 rounded-lg" />
                  <Skeleton className="h-3 w-48 rounded-full" />
                </li>
              ))}
            {!isLoading && filtered.length === 0 && <li className="border-t border-border px-4 py-10 text-center text-xs text-muted-foreground">Nenhum produto encontrado.</li>}
            {filtered.map((p, i) => (
              <motion.li
                key={p.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: Math.min(i * 0.03, 0.2) }}
                className="flex items-center gap-3 border-t border-border px-4 py-2.5 transition-colors hover:bg-muted/40"
              >
                <img src={p.images[0]} alt="" className="h-[42px] w-8 shrink-0 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-xs font-semibold">
                    {p.name}
                    {p.isDemo && <span className="rounded-full bg-amber-100 px-1.5 py-px text-[7px] font-bold uppercase text-amber-600">Teste</span>}
                  </p>
                  <p className="mt-0.5 truncate text-[9px] text-muted-foreground">
                    {categoryLabel(p.category)} · {p.sizes.join(", ")}
                  </p>
                </div>
                <span className="w-20 text-right text-[11px] font-bold text-wine">{formatBRL(p.price)}</span>
                <span className={`hidden w-14 text-right text-[10px] sm:block ${p.stock <= 0 ? "text-red-600" : p.stock <= 5 ? "text-amber-600" : "text-muted-foreground"}`}>
                  {p.stock} un.
                </span>
                <div className="flex gap-3 text-muted-foreground">
                  <button onClick={() => openForm(p)} className="transition hover:text-foreground" aria-label={`Editar ${p.name}`}>
                    <Pencil className="size-3.5" />
                  </button>
                  <button onClick={() => setToDelete(p)} className="transition hover:text-red-600" aria-label={`Excluir ${p.name}`}>
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </motion.li>
            ))}
          </ul>
        </section>
      </main>

      <ProductFormSheet open={formOpen} onOpenChange={setFormOpen} product={editing} />

      <Dialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <DialogContent title="Excluir produto?" description={`“${toDelete?.name}” será removido da loja. Essa ação não pode ser desfeita.`}>
          <div className="mt-5 flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline" size="sm" className="h-9 px-5">Cancelar</Button>
            </DialogClose>
            <Button
              variant="destructive"
              size="sm"
              className="h-9 px-5"
              disabled={del.isPending}
              onClick={async () => {
                if (!toDelete) return;
                await del.mutateAsync(toDelete.id);
                setToDelete(null);
                toast.success("Produto excluído");
              }}
            >
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Admin() {
  const authed = useAuth((s) => s.authed);
  return authed ? <Dashboard /> : <AdminLogin />;
}
