import { Download, Upload } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, apiErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { ImportReport } from '@/types/api';

interface ImportProductsProps {
  onImported?: () => void;
}

export default function ImportProducts({ onImported }: ImportProductsProps) {
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError('Escolha um arquivo CSV.');
      return;
    }

    const body = new FormData();
    body.append('file', file);
    setSubmitting(true);
    setError('');
    setReport(null);
    try {
      const response = await api.post<ImportReport>('/admin/products/import', body);
      setReport(response.data);
      if (response.data.criados > 0) {
        toast.success(`${response.data.criados} produto(s) importado(s).`);
      }
      if (response.data.erros.length > 0) {
        toast.error(`${response.data.erros.length} linha(s) com erro.`);
      }
      onImported?.();
    } catch (submitError) {
      setError(apiErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <label className="field-label" htmlFor="csv-file">
        Arquivo CSV
        <Input
          id="csv-file"
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setReport(null);
            setError('');
          }}
        />
      </label>

      <p className="text-sm text-muted-foreground">
        Colunas: nome, descrição, preço, categoria, tamanho, cor, estoque, imagem (sku opcional).
      </p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" disabled={submitting || !file}>
          <Upload aria-hidden="true" className="size-4" />
          {submitting ? 'Importando…' : 'Importar produtos'}
        </Button>
        <a
          href="/products-example.csv"
          download
          className={cn(buttonVariants({ variant: 'secondary' }), 'text-ink no-underline')}
        >
          <Download aria-hidden="true" className="size-4" /> Baixar exemplo CSV
        </a>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {report && (
        <div className="rounded-lg border border-border p-4" role="status">
          <p className="font-semibold">
            {report.criados} criados, {report.erros.length} erros
          </p>
          {report.erros.length > 0 && (
            <ul className="mt-3 grid gap-1 text-sm text-destructive">
              {report.erros.map((item) => (
                <li key={`${item.linha}-${item.motivo}`}>
                  Linha {item.linha}: {item.motivo}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </form>
  );
}
