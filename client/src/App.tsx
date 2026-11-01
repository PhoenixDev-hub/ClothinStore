import { ShopLayout } from "@/components/layout/ShopLayout";
import { Toaster } from "@/components/ui/sonner";
import Checkout from "@/pages/Checkout";
import Home from "@/pages/Home";
import NotFound from "@/pages/NotFound";
import ProductDetail from "@/pages/ProductDetail";
import Products from "@/pages/Products";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router";

const Admin = lazy(() => import("@/pages/Admin"));

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
});

const router = createBrowserRouter([
  {
    element: <ShopLayout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/produtos", element: <Products /> },
      { path: "/produto/:id", element: <ProductDetail /> },
      { path: "/checkout", element: <Checkout /> },
      { path: "*", element: <NotFound /> },
    ],
  },
  {
    path: "/admin",
    element: (
      <Suspense fallback={<div className="grid min-h-screen place-items-center bg-[#111]"><div className="size-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /></div>}>
        <Admin />
      </Suspense>
    ),
  },
]);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
  );
}
