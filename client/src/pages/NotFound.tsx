import { Link } from "react-router";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-shop grid place-items-center py-32 text-center">
      <div>
        <p className="font-display text-7xl font-extrabold text-wine">404</p>
        <h1 className="mt-2 text-2xl font-bold">Página não encontrada</h1>
        <Button asChild className="mt-6">
          <Link to="/">Voltar para a loja</Link>
        </Button>
      </div>
    </div>
  );
}
