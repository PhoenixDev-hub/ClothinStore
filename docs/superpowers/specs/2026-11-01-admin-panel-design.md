# Admin Panel Design

## Intent

Add a separate admin application for the clothing-store MVP so an operator can manage products, categories, images, prices, and variant inventory.

## Goals

- Create and validate admin sessions using a server-side Redis session and a Secure, HttpOnly, SameSite=Strict cookie with an eight-hour TTL.
- Keep `ADMIN_API_KEY` entirely out of browser storage and configuration.
- Support listing, filtering, pagination, editing, archiving, and deletion of products; CRUD for categories; and image upload.
- Present prices in reais while sending integer centavos to the API.
- Preserve the existing customer app and all existing local edits in `client/`.

## Non-goals

Customer authentication, orders, dashboard, reports, or changes to `client/`.

## Constraints

- Backend is NestJS in `server/`, uses Fastify, Prisma, Redis host/port configuration, and already has an `AdminApiKeyGuard`.
- Admin frontend is a standalone Vite + React + TypeScript app in `admin/`, using Tailwind, shadcn/ui, React Router, TanStack Query, and Axios with credentials.
- Authentication accepts either the existing `x-api-key` header or a valid admin session cookie.
- Login is limited to five requests per minute per IP.
- CORS must allow the configured admin origin and credentials.

## Approaches

- Dedicated Redis connection for admin sessions: isolates authentication availability from the cache's memory fallback; chosen because session checks must fail closed.
- Reuse CacheModule for sessions: fewer connections, but its configured memory fallback would make session durability and multi-instance behavior misleading; rejected.
- `CORS_ORIGIN` list for the admin origin: reuses the existing comma-separated origin configuration without adding a duplicate setting; chosen.

## Design decisions

- Store only a random opaque session identifier in the cookie and Redis; Redis is authoritative for validity and expiry.
- Reuse the existing guarded product write routes and existing category CRUD routes; the backend already implements them.
- Archive products by setting status to `ARCHIVED`; hard delete remains an explicit, confirmed user action.
- Use a restrained, dense, responsive operations interface with a persistent navigation rail, focused tables, and clear destructive-action confirmation.
- Build the app directly in code; standard admin workflows benefit from working controls and familiar interaction patterns over static mockups.

## Acceptance criteria

- Invalid admin keys never create a session; valid keys are checked with timing-safe comparison.
- Sessions expire after eight hours, are revoked on logout, and cannot be validated while Redis is unavailable.
- Admin endpoints accept valid session cookies and valid API-key headers; invalid credentials receive 401.
- Admin CORS requests work with credentials from configured origins.
- Admin pages provide login, product list/filter/pagination, product create/edit with images and variants, category CRUD, image upload, and automatic login redirect on 401.
- Price input and display use reais; API payloads use integer centavos.
- Delete/archive actions require confirmation.
- `client/` is unchanged by this work.
- Server and admin build, lint, and tests are run and their actual outcomes are reported.
