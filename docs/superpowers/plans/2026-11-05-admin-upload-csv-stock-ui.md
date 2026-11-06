# Admin UI — upload, CSV, esgotado e UX — Plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Entregar as tasks A–D somente em `admin/`, consumindo os endpoints existentes no server.

**Constraint:** Não editar `server/` nem `client/`. Outro processo está implementando o server em paralelo; somente `admin/` e este plano são tocados.

**Tech:** React 19, Vite, Tailwind 4, shadcn/ui caseiro, TanStack Query, Axios, Sonner, Vitest + Testing Library.

## Contratos do server usados

- `POST /api/admin/categories/upload` → `{ url }` (multipart campo `file`).
- `POST /api/admin/products/import` → `{ criados: number, erros: { linha, motivo }[] }`.
- `GET /api/admin/products?page&limit` → `Paginated<Product>`; `Product.totalStock` já existe.
- `GET /api/categories` → `Category[]`.

Como o server não expõe estatísticas nem filtro de esgotado, o admin carrega todas as páginas (limit 100) e filtra/ordena/pagina localmente.
`shortcut: carrega o catálogo inteiro no admin; migrar para parâmetros do server quando passar de alguns milhares de produtos`.

## Task A — Upload de imagem de categoria

**Files:** `admin/src/pages/CategoriesPage.tsx`, `admin/src/pages/CategoriesPage.test.tsx` (novo), `admin/src/components/ui/badge.tsx` (se necessário).

- [ ] Teste: escolher arquivo chama `api.post('/admin/categories/upload', FormData)` e exibe preview.
- [ ] Substituir o campo URL por: preview, botão "Escolher imagem" (input file oculto) e toggle "Colar URL manualmente".
- [ ] Validar tipo JPG/PNG/WebP e 5 MB antes do envio; mostrar erro/toast.
- [ ] Manter validação de URL no submit e o preview responsivo.
- [ ] Rodar `npm test`, `npm run build`, `npm run lint`. Commit `feat(admin): upload de imagem de categoria`.

## Task B — Importar produtos via CSV

**Files:** `admin/src/components/ImportProducts.tsx` (novo), `admin/src/pages/ImportProductsPage.tsx` (novo), `admin/src/pages/ProductsPage.tsx`, `admin/src/types/api.ts`, `admin/public/products-example.csv` (novo), `admin/src/components/ImportProducts.test.tsx` (novo).

- [ ] Teste: upload chama `/admin/products/import` e mostra "X criados, Y erros" + linhas.
- [ ] Componente com input file, envio multipart, relatório e botão "Baixar exemplo CSV".
- [ ] Modal na página de produtos + página/menu "Importar" reutilizando o componente.
- [ ] Invalidar `['admin-products']` após sucesso.
- [ ] Rodar testes/build/lint. Commit `feat(admin): importacao de produtos via CSV`.

## Task C — Badge e filtro de esgotado

**Files:** `admin/src/lib/stock.ts` (novo) + teste, `admin/src/components/ui/badge.tsx`, `admin/src/pages/ProductsPage.tsx`, `admin/src/lib/catalog.ts` (novo) + teste.

- [ ] Teste dos limiares: 0 → `out`, 1–4 → `low`, ≥5 → `ok`.
- [ ] Badge vermelho "ESGOTADO" e amarelo "Estoque baixo (< 5)" na listagem.
- [ ] Botão/checkbox "Mostrar só esgotados" com `aria-pressed`, filtrando o catálogo local.
- [ ] Rodar testes/build/lint. Commit `feat(admin): badge e filtro de produtos esgotados`.

## Task D — Melhorias de UX

**Files:** `admin/src/pages/DashboardPage.tsx` (novo), `admin/src/lib/catalog.ts`, `admin/src/lib/admin-products.ts` (novo), `admin/src/components/ui/confirm-dialog.tsx` (novo), `admin/src/App.tsx`, `admin/src/pages/ProductsPage.tsx`, `admin/src/pages/CategoriesPage.tsx`, `admin/src/pages/ProductEditorPage.tsx`, testes.

- [ ] `fetchAllAdminProducts()` percorre as páginas e `catalogStats()` calcula totais.
- [ ] Dashboard com cards: produtos, categorias, esgotados, estoque baixo; rota inicial `/dashboard`.
- [ ] Busca por nome em produtos e categorias; ordenação nome/preço/estoque; paginação de 20.
- [ ] Toasts de sucesso/erro em criar/editar/excluir; modal de confirmação substitui `window.confirm`.
- [ ] Skeleton já existente preservado; menu lateral com Dashboard, Produtos, Categorias, Importar.
- [ ] Rodar testes/build/lint. Commit `feat(admin): dashboard, busca, ordenacao e confirmacao`.

## Verificação final

- `npm test`, `npm run build`, `npm run lint` em `admin/`.
- Conferir preview, relatório CSV, badges, filtro, dashboard e responsividade.
- Relatar limitações: endpoint de exemplo não é servido pelo server, então o admin traz uma cópia.
