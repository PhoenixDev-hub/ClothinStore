import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { categoriesApi, productsApi } from "@/lib/api";
import type { ProductQuery } from "@/types";

export const useProducts = (query: ProductQuery = {}, keepPrevious = false, enabled = true) =>
  useQuery({
    queryKey: ["products", query],
    queryFn: () => productsApi.list(query),
    placeholderData: keepPrevious ? keepPreviousData : undefined,
    enabled,
  });

export const useProduct = (slug?: string) =>
  useQuery({
    queryKey: ["product", slug],
    queryFn: () => productsApi.get(slug!),
    enabled: Boolean(slug),
    retry: false,
  });

export const useCategories = () =>
  useQuery({ queryKey: ["categories"], queryFn: categoriesApi.list, staleTime: 5 * 60_000 });
