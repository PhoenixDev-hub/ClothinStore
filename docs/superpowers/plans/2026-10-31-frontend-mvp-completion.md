# Frontend MVP Completion Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (native) or superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the storefront compile, connect it to the real NestJS API, and deliver catalog + cart + single WhatsApp order message, with no auth/payment flows.

**Architecture:** Keep one frontend tree (`src/components/layout`, `src/components/ui`, camelCase types). Delete the parallel legacy tree (`components/store`, `src/lib/cart.tsx`, `src/lib/seed.ts`, fake API in `src/lib/api.ts`). All catalog data comes from the backend (prices in cents); the cart is client-side Zustand and is quoted on the server before generating the WhatsApp link.

**Tech Stack:** React 19, Vite, TypeScript, Tailwind 4, shadcn/ui, React Router 7, Zustand 5, TanStack Query 5, Axios, Lucide.

**Spec:** This audit report (no separate spec file). Decisions below are pending user approval.

## Global Constraints

- No login, signup, profile, JWT/session, wishlist, reviews, order tracking, or customer area in the storefront.
- No payment gateway. Final action = one WhatsApp message containing every cart item.
- Server contract: `GET /api/products` returns `{ data, meta }`; `GET /api/products/:slug`; `GET /api/categories`; `POST /api/cart/quote` and `POST /api/cart/whatsapp` accept `{ items: [{ sku, quantity }] }`; prices/stock in cents.
- Never expose admin credentials in the client bundle.
- Every change must keep `npx tsc -b`, `npx vite build`, and `npx oxlint` green.

## Open decisions (block execution)

1. **Admin panel:** delete from this app, or isolate in a separate build/route with real server auth? It is out of MVP scope and currently leaks a password.
2. **Checkout form:** replace `/checkout` with a cart page + single WhatsApp CTA (recommended), or keep name/phone/address fields inside the message?
3. **Category taxonomy:** backend categories are DB-driven; current client hardcodes `feminino/fitness/acessorios/infantil`. Confirm the seed categories the storefront must show.

## Review Focus

- Empty cart / all-items-unavailable quote: CTA must be disabled or explain what to remove, never send an empty order.
- Price tampering in localStorage: displayed totals must come from `POST /cart/quote`, not from stored prices.
- Item unavailable/insufficient stock: partial quote must list unavailable items without dropping available ones.
- WhatsApp popup blocked: user must get a fallback link, and the cart must not be cleared.
- Network failure on catalog/detail: friendly error with retry, never a blank page.

---

### Phase 0: Freeze architecture

- [ ] Pick the camelCase tree as the only tree; list files to delete (`src/components/store/**`, `src/lib/cart.tsx`, `src/lib/seed.ts`, `src/types.ts` if replaced, `src/pages/Catalog.tsx`).
- [ ] Confirm the three open decisions above.
- [ ] Delete dead files in one commit; verify only one ProductCard, one cart store, one API module remain.

### Phase 1: Restore build (blocking)

**Files:** `src/lib/utils.ts`, `src/store/cart.ts`, `src/store/auth.ts` (remove), `src/lib/api.ts`, `src/App.tsx`, `src/main.tsx`, `package.json`, `src/index.css`.

- [ ] Add the missing runtime dependency (`motion`) or replace animations with CSS; add `clsx` + `tailwind-merge` only if `cn` package proves insufficient.
- [ ] Restore `formatBRL`, `discountPercent`, `categoryLabel`, `CATEGORIES`, `ALL_SIZES` where the remaining tree imports them (single module, no barrel).
- [ ] Move `useCart` to `src/store/cart.ts`; make it the only cart implementation; cap quantity at stock.
- [ ] Delete the fake API and expose real `productsApi`, `categoriesApi`, `cartApi`, `settingsApi` over the Axios instance with `VITE_API_URL` fallback `http://localhost:3001/api`.
- [ ] Fix `@/pages/Products` casing (`products.tsx` → `Products.tsx`).
- [ ] Remove duplicate providers: `main.tsx` keeps only React root + CSS; `App.tsx` owns QueryClient and router.
- [ ] Add shadcn CSS variables (`--primary`, `--ring`, `--border`, `--input`, `--radius`, etc.) to `index.css` and map them to the existing wine palette.
- [ ] Add the missing `Label`/`Textarea` imports (use `@/components/ui/label`, `@/components/ui/textarea`) or delete the admin files.
- [ ] Verify: `npx tsc -b` → 0 errors; `npx vite build` → exit 0.

### Phase 2: API contract layer

**Files:** `src/types.ts`, `src/lib/api.ts`, `src/hooks/queries.ts`.

- [ ] Align types with server JSON: numeric `id`, `slug`, camelCase, `price` in cents, `variants[]` with `sku/size/color/stock`, `category` object.
- [ ] `useProducts(query)` accepts `page/limit/category/size/color/minPrice/maxPrice/search` and returns `{ data, meta }`.
- [ ] `useProduct(slug)`; `useCategories()`; `useSettings()` only if the backend exposes it (otherwise a build-time env constant).
- [ ] Centralize error mapping (`ApiError`) and one retry policy.

### Phase 3: Storefront pages

- [ ] Home: featured/new shelves from API, real category links, loading + error + empty states.
- [ ] Products: URL-driven filters (category/size/color/price/search/sort/page), 2/3/4 grid, pagination, Sheet filters on mobile, chips, empty state.
- [ ] Product detail: `/produto/:slug`, gallery, price, description, variant selector using real variants (SKU), stock-aware quantity, add to cart, WhatsApp CTA.
- [ ] Cart: dedicated page + drawer, quantity/remove, subtotal from quote, single WhatsApp CTA.

### Phase 4: Cart quote + WhatsApp

- [ ] Cart items keyed by `sku`; quantity clamped by `maxStock`.
- [ ] `POST /api/cart/quote` on cart open/change (debounced); display server subtotal and unavailable items.
- [ ] `POST /api/cart/whatsapp` returns `whatsappUrl` + `message`; open it only after success; keep the cart on failure.
- [ ] Remove the local message builder and the checkout form if decision 2 says so.

### Phase 5: UI/UX and accessibility

- [ ] Raise body/label minimums (11–12px → 14px where readable), keep display scale intentional.
- [ ] All interactive targets ≥ 44×44 (swatches, size pills, quantity buttons, icon buttons).
- [ ] Use `Sheet` with focus trap for mobile filters; current manual overlay has no focus management or scroll lock.
- [ ] Add visible `focus-visible` styles on every custom button/link.
- [ ] Honor `prefers-reduced-motion` for marquee, hero, card animations.
- [ ] Ensure CTA is visible on product cards at all breakpoints (not hover-only).
- [ ] Add friendly error + retry to Home, Products, Detail, Footer; keep existing empty states.
- [ ] Fix missing `/img/*` assets or replace with API/Unsplash URLs.

### Phase 6: Performance

- [ ] `React.lazy` per route for Home, Products, Detail, Cart (Admin removed).
- [ ] `loading="lazy"`, `decoding="async"`, width/height or `aspect-*` on all product images; eager only for hero.
- [ ] Remove unused deps (`shadcn` CLI, unused fontsource packages) and duplicate font loading (Google Fonts vs @fontsource).
- [ ] Verify bundle output and no duplicate component trees.

### Phase 7: Scope cleanup and security

- [ ] Delete admin/auth/checkout-form code and the hardcoded passwords; no `VITE_ADMIN_PASSWORD`.
- [ ] Confirm absence of wishlist, reviews, tracking, account, payment.
- [ ] `grep` for `password`, `token`, `localStorage` to ensure no secrets or fake persistence remain.

### Phase 8: Verification

- [ ] Add Vitest + Testing Library; tests for cart totals, quantity cap, quote mapping, WhatsApp URL call, empty/error states.
- [ ] Playwright E2E: catalog → filter → detail → add variant → cart → WhatsApp link contains all items.
- [ ] Run `npx tsc -b`, `npx vite build`, `npx oxlint`, unit tests, E2E; report exact counts.
- [ ] Manual check at 360px, 768px, 1280px with keyboard navigation.
