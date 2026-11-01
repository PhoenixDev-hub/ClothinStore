import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productsApi, settingsApi } from "@/lib/api";
import type { ProductInput, ProductQuery } from "@/types";

export const useProducts = (q: ProductQuery = {}, opts?: { keepPrevious?: boolean }) =>
  useQuery({
    queryKey: ["products", q],
    queryFn: () => productsApi.list(q),
    placeholderData: opts?.keepPrevious ? keepPreviousData : undefined,
  });

export const useProduct = (id?: string) =>
  useQuery({ queryKey: ["product", id], queryFn: () => productsApi.get(id!), enabled: !!id, retry: false });

export const useSettings = () => useQuery({ queryKey: ["settings"], queryFn: settingsApi.get, staleTime: 60_000 });

const useInvalidate = () => {
  const qc = useQueryClient();
  return () => Promise.all([qc.invalidateQueries({ queryKey: ["products"] }), qc.invalidateQueries({ queryKey: ["product"] })]);
};

export const useSaveProduct = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: ProductInput }) =>
      id ? productsApi.update(id, data) : productsApi.create(data),
    onSuccess: invalidate,
  });
};

export const useDeleteProduct = () => {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: productsApi.remove, onSuccess: invalidate });
};

export const useClearDemo = () => {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: productsApi.clearDemo, onSuccess: invalidate });
};

export const useRestoreDemo = () => {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: productsApi.restoreDemo, onSuccess: invalidate });
};

export const useSaveWhatsapp = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: settingsApi.update,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
};
