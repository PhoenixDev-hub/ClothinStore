import { useQueryClient } from '@tanstack/react-query';
import ImportProducts from '@/components/ImportProducts';

export default function ImportProductsPage() {
  const queryClient = useQueryClient();

  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Importar produtos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Envie um CSV para cadastrar vários produtos de uma vez. Linhas com erro não interrompem as demais.
        </p>
      </div>
      <section className="rounded-xl border border-border bg-white p-5">
        <ImportProducts
          onImported={() => {
            void queryClient.invalidateQueries({ queryKey: ['admin-products'] });
          }}
        />
      </section>
    </div>
  );
}
