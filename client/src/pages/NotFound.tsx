import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center" data-testid="not-found-page">
      <p className="font-heading text-7xl font-black text-wine">404</p>
      <h1 className="mt-4 font-heading text-2xl font-bold">Página não encontrada</h1>
      <Link to="/" className="mt-6 inline-flex rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white" data-testid="not-found-home-link">
        Voltar para a loja
      </Link>
    </div>
  );
}
