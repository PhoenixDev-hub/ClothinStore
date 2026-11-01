import { useEffect, useRef, useState } from "react";
import { ImagePlus, Link2, Plus, Star, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSaveProduct } from "@/hooks/queries";
import { ALL_SIZES, CATEGORIES, cn } from "@/lib/utils";
import type { CategorySlug, Product, ProductColor } from "@/types";

interface FormState {
  name: string;
  description: string;
  price: string;
  compareAtPrice: string;
  category: CategorySlug;
  stock: string;
  sizes: string[];
  colors: ProductColor[];
  images: string[];
  isNew: boolean;
  isBestSeller: boolean;
}

const empty: FormState = {
  name: "",
  description: "",
  price: "",
  compareAtPrice: "",
  category: "feminino",
  stock: "0",
  sizes: [],
  colors: [],
  images: [],
  isNew: false,
  isBestSeller: false,
};

const fromProduct = (p: Product): FormState => ({
  name: p.name,
  description: p.description,
  price: p.price.toFixed(2).replace(".", ","),
  compareAtPrice: p.compareAtPrice ? p.compareAtPrice.toFixed(2).replace(".", ",") : "",
  category: p.category,
  stock: String(p.stock),
  sizes: p.sizes,
  colors: p.colors,
  images: p.images,
  isNew: p.isNew,
  isBestSeller: p.isBestSeller,
});

const toDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 1000;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const toNumber = (v: string) => Number(v.replace(",", "."));

export function ProductFormSheet({ open, onOpenChange, product }: { open: boolean; onOpenChange: (v: boolean) => void; product?: Product | null }) {
  const [f, setF] = useState<FormState>(empty);
  const [customSize, setCustomSize] = useState("");
  const [link, setLink] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const save = useSaveProduct();

  useEffect(() => {
    if (open) {
      setF(product ? fromProduct(product) : empty);
      setCustomSize("");
      setLink("");
    }
  }, [open, product]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((s) => ({ ...s, [k]: v }));
  const toggleSize = (s: string) => set("sizes", f.sizes.includes(s) ? f.sizes.filter((x) => x !== s) : [...f.sizes, s]);
  const sizeOptions = [...ALL_SIZES, ...f.sizes.filter((s) => !ALL_SIZES.includes(s))];

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    try {
      const urls = await Promise.all(Array.from(files).map(toDataUrl));
      set("images", [...f.images, ...urls]);
    } catch {
      toast.error("Não foi possível ler a imagem.");
    }
  };

  const makeCover = (i: number) => set("images", [f.images[i], ...f.images.filter((_, idx) => idx !== i)]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = toNumber(f.price);
    if (!f.name.trim()) return toast.error("Informe o nome do produto.");
    if (!price || price <= 0) return toast.error("Informe um preço válido.");
    if (f.sizes.length === 0) return toast.error("Selecione ao menos um tamanho.");
    if (f.images.length === 0) return toast.error("Adicione ao menos uma foto.");
    await save.mutateAsync({
      id: product?.id,
      data: {
        name: f.name.trim(),
        description: f.description.trim(),
        price,
        compareAtPrice: f.compareAtPrice ? toNumber(f.compareAtPrice) : null,
        category: f.category,
        stock: Math.max(0, Math.floor(Number(f.stock) || 0)),
        sizes: f.sizes,
        colors: f.colors.filter((c) => c.name.trim()),
        images: f.images,
        isNew: f.isNew,
        isBestSeller: f.isBestSeller,
      },
    });
    toast.success(product ? "Produto atualizado" : "Produto criado");
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title={product ? "Editar produto" : "Novo produto"} className="max-w-[26.5rem]">
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-6 pb-4">
            <div>
              <Label>Nome *</Label>
              <Input value={f.name} onChange={(e) => set("name", e.target.value)} className="h-9 rounded-lg text-xs" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={f.description} onChange={(e) => set("description", e.target.value)} className="min-h-16 rounded-lg text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Preço (R$) *</Label>
                <Input inputMode="decimal" value={f.price} onChange={(e) => set("price", e.target.value)} className="h-9 rounded-lg text-xs" />
              </div>
              <div>
                <Label>Preço “de” (opcional)</Label>
                <Input inputMode="decimal" value={f.compareAtPrice} onChange={(e) => set("compareAtPrice", e.target.value)} className="h-9 rounded-lg text-xs" />
              </div>
              <div>
                <Label>Categoria *</Label>
                <Select value={f.category} onValueChange={(v) => set("category", v as CategorySlug)}>
                  <SelectTrigger className="h-9 w-full rounded-lg text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.slug} value={c.slug}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estoque *</Label>
                <Input inputMode="numeric" value={f.stock} onChange={(e) => set("stock", e.target.value)} className="h-9 rounded-lg text-xs" />
              </div>
            </div>

            <div>
              <Label>Tamanhos *</Label>
              <div className="flex flex-wrap gap-1.5">
                {sizeOptions.map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => toggleSize(s)}
                    className={cn(
                      "grid h-7 min-w-7 place-items-center rounded-full border px-2.5 text-[10px] font-medium transition",
                      f.sizes.includes(s) ? "border-wine bg-wine text-white" : "border-border bg-white hover:border-wine",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <Input
                  placeholder="Outro tamanho (ex: 36)"
                  value={customSize}
                  onChange={(e) => setCustomSize(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      document.getElementById("add-size")?.click();
                    }
                  }}
                  className="h-9 rounded-lg text-xs"
                />
                <Button
                  id="add-size"
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={() => {
                    const v = customSize.trim();
                    if (v && !f.sizes.includes(v)) set("sizes", [...f.sizes, v]);
                    setCustomSize("");
                  }}
                >
                  Adicionar
                </Button>
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <Label className="mb-0">Cores</Label>
                <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={() => set("colors", [...f.colors, { name: "", hex: "#111111" }])}>
                  <Plus className="size-3" /> Cor
                </Button>
              </div>
              <div className="space-y-2">
                {f.colors.map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <label className="relative size-7 shrink-0 cursor-pointer overflow-hidden rounded-md ring-1 ring-black/15" style={{ background: c.hex }}>
                      <input
                        type="color"
                        value={c.hex}
                        onChange={(e) => set("colors", f.colors.map((x, idx) => (idx === i ? { ...x, hex: e.target.value } : x)))}
                        className="absolute inset-0 size-full cursor-pointer opacity-0"
                        aria-label="Escolher cor"
                      />
                    </label>
                    <Input
                      placeholder="Nome da cor (ex: Vinho)"
                      value={c.name}
                      onChange={(e) => set("colors", f.colors.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)))}
                      className="h-9 rounded-lg text-xs"
                    />
                    <button type="button" onClick={() => set("colors", f.colors.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-red-600" aria-label="Remover cor">
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Fotos</Label>
              <div className="grid grid-cols-4 gap-2">
                {f.images.map((src, i) => (
                  <div key={src.slice(-24) + i} className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-muted">
                    <img src={src} alt="" className="size-full object-cover" />
                    {i === 0 && <span className="absolute left-1 top-1 rounded-full bg-wine px-1.5 py-0.5 text-[7px] font-bold uppercase text-white">Capa</span>}
                    <div className="absolute inset-x-1 bottom-1 flex justify-between">
                      {i !== 0 ? (
                        <button type="button" onClick={() => makeCover(i)} className="grid size-5 place-items-center rounded-full bg-white/90 text-ink shadow" aria-label="Definir como capa">
                          <Star className="size-2.5" />
                        </button>
                      ) : (
                        <span />
                      )}
                      <button type="button" onClick={() => set("images", f.images.filter((_, idx) => idx !== i))} className="grid size-5 place-items-center rounded-full bg-white/90 text-red-600 shadow" aria-label="Remover foto">
                        <Trash2 className="size-2.5" />
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="grid aspect-[3/4] place-items-center rounded-xl border border-dashed border-border text-[9px] text-muted-foreground transition hover:border-wine hover:text-wine"
                >
                  <span className="flex flex-col items-center gap-1">
                    <ImagePlus className="size-4" /> Enviar
                  </span>
                </button>
                <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
              </div>
              <div className="mt-2 flex gap-2">
                <div className="relative flex-1">
                  <Link2 className="pointer-events-none absolute left-3 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Ou cole o link da imagem" value={link} onChange={(e) => setLink(e.target.value)} className="h-9 rounded-lg pl-8 text-xs" />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={() => {
                    if (/^https?:\/\//.test(link.trim())) {
                      set("images", [...f.images, link.trim()]);
                      setLink("");
                    } else toast.error("Cole um link http(s) válido.");
                  }}
                >
                  <Upload /> Adicionar
                </Button>
              </div>
            </div>

            <div className="flex gap-5 pt-1">
              <label className="flex cursor-pointer items-center gap-2 text-xs">
                <Checkbox checked={f.isNew} onCheckedChange={(v) => set("isNew", v === true)} className="rounded-[5px]" /> Novidade
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-xs">
                <Checkbox checked={f.isBestSeller} onCheckedChange={(v) => set("isBestSeller", v === true)} className="rounded-[5px]" /> Mais vendido
              </label>
            </div>
          </div>

          <div className="flex gap-2 border-t border-border bg-white px-6 py-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={save.isPending}>
              {save.isPending ? "Salvando..." : "Salvar produto"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
