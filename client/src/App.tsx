import { Routes, Route } from "react-router-dom"
import { Toaster } from "@/components/ui/sonner"
import StoreLayout from "@/components/store/StoreLayout"
import Home from "@/pages/Home"
import Catalog from "@/pages/Catalog"
import ProductDetail from "@/pages/ProductDetail"
import Checkout from "@/pages/Checkout"
import Admin from "@/pages/Admin"
import NotFound from "@/pages/NotFound"

export default function App() {
  return (
    <>
      <Routes>
        <Route element={<StoreLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/produtos" element={<Catalog />} />
          <Route path="/produto/:id" element={<ProductDetail />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="/admin" element={<Admin />} />
      </Routes>
      <Toaster />
    </>
  )
}
