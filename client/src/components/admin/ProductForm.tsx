import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Link2, Loader2, Plus, Star, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SafeImage from "@/components/store/SafeImage";
import { apiPost, apiPut, apiUpload, ApiError } from "@/lib/api";
import { CATEGORIES } from "@/lib/store";
import type { Category, ColorOption, ImageUploadResult, Product, ProductCreate } from "@/lib/types";
import { cn } from "@/lib/utils";

const SIZE_PRESETS = ["PP", "P", "M", "G", "GG", "XG", "Único", "2", "4", "6", "8", "10", "12"];

const toMoney = (v: number | null | undefined) => (v ? v.toFixed(2).replace(".", ",") : "");
const parseMoney = (v: string) => {
  const n = Number(v.replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : NaN;
};

interface Props {
  initial?: Product | null;
  onDone: () => void;
}

export default function ProductForm({ initial, onDone }: Props) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(toMoney(initial?.price));
  const [compare, setCompare] = useState(toMoney(initial?.compare_at_price));
  const [category, setCategory] = useState<Category>(initial?.category ?? "feminino");
  const [sizes, setSizes] = useState<string[]>(initial?.sizes ?? []);
  const [customSize, setCustomSize] = useState("");
  const [colors, setColors] = useState<ColorOption[]>(initial?.colors ?? []);
  const [stock, setStock] = useState(String(initial?.stock ?? 10));
  const [isNew, setIsNew] = useState(initial?.is_new ?? true);
  const [isBest, setIsBest] = useState(initial?.is_bestseller ?? false);
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const save = useMutation({
    mutationFn: (body: ProductCreate) =>
      initial ? apiPut<Product>(`/admin/products/${initial.id}`, body) : apiPost<Product>("/admin/products", body),
    onSuccess: (p) => {
      toast.success(initial ? "Produto atualizado" : `“${p.name}” cadastrado e já disponível na loja`);
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["admin"] });
      onDone();
    },
    onError: (e) => {
      if (e instanceof ApiError && e.status === 401) setError("Sessão expirada. Entre novamente.");
      else setError("Não foi possível salvar. Confira os campos.");
    },
  });

  const toggleSize = (s: string) => setSizes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const addCustomSize = () => {
    const s = customSize.trim();
    if (s && !sizes.includes(s)) setSizes((p) => [...p, s]);
    setCustomSize("");
  };

  const addImageUrl = () => {
    const u = imageUrl.trim();
    if (!/^https?:\/\//i.test(u) && !u.startsWith("/api/")) {
      toast.error("Cole um link de imagem válido (https://...)");
      return;
    }
    setImages((p) => [...p, u]);
    setImageUrl("");
  };

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const f of Array.from(files)) {
        const form = new FormData();
        form.append("file", f);
        const r = await apiUpload<ImageUploadResult>("/admin/images", form);
        setImages((p) => [...p, r.url]);
      }
      toast.success("Foto(s) enviada(s)");
    } catch (e) {
      toast.error(e instanceof ApiError && e.status === 413 ? "Imagem muito grande (máx 8MB)" : "Falha ao enviar a foto");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const p = parseMoney(price);
    const c = compare.trim() ? parseMoney(compare) : null;
    const st = Number.parseInt(stock, 10);
    if (!name.trim()) return setError("Informe o nome do produto.");
    if (!(p > 0)) return setError("Informe um preço válido (ex: 129,90).");
    if (c !== null && Number.isNaN(c)) return setError("Preço “de” inválido.");
    if (!Number.isFinite(st) || st < 0) return setError("Estoque inválido.");
    if (sizes.length === 0) return setError("Selecione ao menos um tamanho (use “Único” para acessórios).");
    if (colors.some((col) => !col.name.trim())) return setError("Dê um nome para todas as cores.");
    save.mutate({
      name: name.trim(),
      description: description.trim(),
      price: p,
      compare_at_price: c && c > p ? c : null,
      category,
      sizes,
      colors: colors.map((col) => ({ ...col, name: col.name.trim() })),
      stock: st,
      is_new: isNew,
      is_bestseller: isBest,
      images,
    });
  };

  const label = "text-[13px] font-semibold text-neutral-700";
  const input = "h-11 rounded-xl border-neutral-300 bg-white";

  return (
    <form onSubmit={submit} className="flex h-full flex-col" data-testid="product-form">
      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5 md:px-6">
        <div className="space-y-1.5">
          <Label htmlFor="pf-name" className={label}>Nome *</Label>
          <Input id="pf-name" data-testid="product-form-name" value={name} onChange={(e) => setName(e.target.value)} className={input} placeholder="Ex: Vestido Longo Cetim" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pf-desc" className={label}>Descrição</Label>
          <Textarea id="pf-desc" data-testid="product-form-description" value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-24 rounded-xl border-neutral-300 bg-white" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="pf-price" className={label}>Preço (R$) *</Label>
            <Input id="pf-price" data-testid="product-form-price" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} className={input} placeholder="129,90" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-compare" className={label}>Preço “de” (opcional)</Label>
            <Input id="pf-compare" data-testid="product-form-compare-price" inputMode="decimal" value={compare} onChange={(e) => setCompare(e.target.value)} className={input} placeholder="159,90" />
          </div>
          <div className="space-y-1.5">
            <Label className={label}>Categoria *</Label>
            <Select value={category} onValueChange={(v: string) => setCategory(v as Category)}>
              <SelectTrigger className="h-11 w-full rounded-xl border-neutral-300 bg-white" data-testid="product-form-category">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.id} value={c.id} data-testid={`product-form-category-${c.id}`}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-stock" className={label}>Estoque *</Label>
            <Input id="pf-stock" data-testid="product-form-stock" inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value.replace(/\D/g, ""))} className={input} />
          </div>
        </div>

        <div className="space-y-2.5">
          <Label className={label}>Tamanhos *</Label>
          <div className="flex flex-wrap gap-2">
            {[...SIZE_PRESETS, ...sizes.filter((s) => !SIZE_PRESETS.includes(s))].map((s) => {
              const on = sizes.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSize(s)}
                  data-testid={`product-form-size-${s.toLowerCase()}`}
                  aria-pressed={on}
                  className={cn(
                    "h-9 min-w-10 rounded-full border px-3 text-xs font-semibold transition-colors duration-200",
                    on ? "border-wine bg-wine text-white" : "border-neutral-300 bg-white hover:border-ink",
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <Input
              value={customSize}
              onChange={(e) => setCustomSize(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomSize();
                }
              }}
              placeholder="Outro tamanho (ex: 36)"
              data-testid="product-form-custom-size"
              className="h-9 rounded-full border-neutral-300 bg-white"
            />
            <button type="button" onClick={addCustomSize} data-testid="product-form-add-size" className="h-9 shrink-0 rounded-full bg-neutral-100 px-4 text-xs font-semibold hover:bg-neutral-200">
              Adicionar
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <Label className={label}>Cores</Label>
            <button
              type="button"
              onClick={() => setColors((p) => [...p, { name: "", hex: "#121212" }])}
              data-testid="product-form-add-color"
              className="flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-semibold hover:bg-neutral-200"
            >
              <Plus className="size-3.5" /> Cor
            </button>
          </div>
          {colors.length === 0 && <p className="text-xs text-neutral-500">Sem cores cadastradas (aparecerá como “Única”).</p>}
          {colors.map((c, i) => (
            <div key={i} className="flex items-center gap-2" data-testid={`product-form-color-row-${i}`}>
              <input
                type="color"
                value={c.hex}
                onChange={(e) => setColors((p) => p.map((x, j) => (j === i ? { ...x, hex: e.target.value } : x)))}
                data-testid={`product-form-color-hex-${i}`}
                className="size-10 shrink-0 cursor-pointer rounded-full border border-neutral-300 bg-white p-1"
                aria-label="Cor"
              />
              <Input
                value={c.name}
                onChange={(e) => setColors((p) => p.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                placeholder="Nome da cor (ex: Vinho)"
                data-testid={`product-form-color-name-${i}`}
                className="h-10 rounded-full border-neutral-300 bg-white"
              />
              <button
                type="button"
                aria-label="Remover cor"
                onClick={() => setColors((p) => p.filter((_, j) => j !== i))}
                data-testid={`product-form-color-remove-${i}`}
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-neutral-400 hover:bg-red-50 hover:text-red-600"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="space-y-2.5">
          <Label className={label}>Fotos</Label>
          <div className="grid grid-cols-4 gap-2.5">
            {images.map((src, i) => (
              <div key={`${src}-${i}`} className="group relative" data-testid={`product-form-image-${i}`}>
                <SafeImage src={src} alt="" className="aspect-[3/4] w-full rounded-xl" />
                {i === 0 && (
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-wine px-2 py-0.5 text-[9px] font-bold uppercase text-white">
                    Capa
                  </span>
                )}
                <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between">
                  {i > 0 ? (
                    <button
                      type="button"
                      aria-label="Definir como capa"
                      onClick={() => setImages((p) => [p[i], ...p.filter((_, j) => j !== i)])}
                      data-testid={`product-form-image-cover-${i}`}
                      className="flex size-7 items-center justify-center rounded-full bg-white/95 text-ink shadow"
                    >
                      <Star className="size-3.5" />
                    </button>
                  ) : (
                    <span />
                  )}
                  <button
                    type="button"
                    aria-label="Remover foto"
                    onClick={() => setImages((p) => p.filter((_, j) => j !== i))}
                    data-testid={`product-form-image-remove-${i}`}
                    className="flex size-7 items-center justify-center rounded-full bg-white/95 text-red-600 shadow"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              data-testid="product-form-upload-button"
              className="flex aspect-[3/4] flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-neutral-300 text-neutral-500 transition-colors duration-200 hover:border-wine hover:text-wine"
            >
              {uploading ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
              <span className="text-[10px] font-semibold">{uploading ? "Enviando" : "Enviar"}</span>
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => void uploadFiles(e.target.files)}
            data-testid="product-form-file-input"
          />
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addImageUrl();
                  }
                }}
                placeholder="Ou cole o link da imagem"
                data-testid="product-form-image-url"
                className="h-10 rounded-full border-neutral-300 bg-white pl-9"
              />
            </div>
            <button
              type="button"
              onClick={addImageUrl}
              data-testid="product-form-add-image-url"
              className="flex h-10 shrink-0 items-center gap-1 rounded-full bg-neutral-100 px-4 text-xs font-semibold hover:bg-neutral-200"
            >
              <Upload className="size-3.5" /> Adicionar
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium">
            <Checkbox checked={isNew} onCheckedChange={(v) => setIsNew(Boolean(v))} data-testid="product-form-is-new" />
            Novidade
          </label>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium">
            <Checkbox checked={isBest} onCheckedChange={(v) => setIsBest(Boolean(v))} data-testid="product-form-is-bestseller" />
            Mais vendido
          </label>
        </div>
      </div>

      <div className="border-t border-neutral-100 bg-white px-5 py-4 md:px-6">
        {error && (
          <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700" data-testid="product-form-error">
            {error}
          </p>
        )}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onDone}
            data-testid="product-form-cancel"
            className="h-12 flex-1 rounded-full border border-neutral-300 text-sm font-semibold hover:border-ink"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={save.isPending || uploading}
            data-testid="product-form-submit"
            className="flex h-12 flex-[2] items-center justify-center gap-2 rounded-full bg-wine text-sm font-semibold text-white transition-[background-color,transform] duration-200 hover:bg-wine-hover active:scale-[0.98] disabled:opacity-60"
          >
            {save.isPending && <Loader2 className="size-4 animate-spin" />}
            {initial ? "Salvar alterações" : "Cadastrar produto"}
          </button>
        </div>
      </div>
    </form>
  );
}
