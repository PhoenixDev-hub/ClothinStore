# Admin Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build secure admin authentication and a standalone catalogue-management app.

**Architecture:** Add a guarded NestJS auth controller backed by a dedicated ioredis session connection; extend the existing product controller for writes. Build a separate Vite app that uses cookie credentials, React Query, and the existing API contracts.

**Tech Stack:** NestJS, Fastify, ioredis, Prisma, Vite, React, TypeScript, Tailwind, shadcn/ui, React Router, TanStack Query, Axios, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-01-admin-panel-design.md`

## Global Constraints

- `ADMIN_API_KEY` never reaches browser code, browser storage, or Vite variables.
- Login exchanges the key for an HttpOnly, Secure, SameSite=Strict cookie.
- Sessions are stored in Redis for eight hours and fail closed if Redis is unavailable.
- Existing `x-api-key` authorization remains supported.
- Do not modify `client/`.
- Do not add customer login, orders, dashboard, or reports.
- Confirm before deleting or archiving.

## Review Focus

- Redis unavailable or reconnecting: authentication fails closed and does not accept a stale session.
- Multiple configured CORS origins: credentials are allowed only for a listed origin.
- Malformed, missing, or non-numeric prices: form validation prevents invalid cents payloads.
- Empty product images or variants: UI follows API-required fields and supports valid empty variants.
- Session cookie missing or expired: protected routes redirect to `/login` without exposing the API key.

---

### Task 1: Admin session authentication and CORS

**Files:**
- Create `server/src/auth/admin-auth.controller.ts`, `server/src/auth/admin-auth.service.ts`, `server/src/auth/admin-auth.module.ts`, and corresponding specs.
- Modify `server/src/app.module.ts`, `server/src/main.ts`, `server/src/common/guards/admin-api-key.guard.ts`, and `server/src/common/guards/decorators/admin.decorator.ts`.
- Add `@fastify/cookie` to server dependencies.

**Interfaces:**
- Produces `POST /api/auth/admin`, `POST /api/auth/admin/logout`, `GET /api/auth/admin/me`.
- Cookie name `admin_session`; Redis key prefix `admin:session:`; TTL `28_800` seconds.

- [ ] Write tests for timing-safe login success/failure, cookie options, Redis TTL, logout, session validation, fallback API-key guard, and login throttle metadata.
- [ ] Run focused auth/guard tests and observe expected failures.
- [ ] Implement cookie registration, Redis-backed sessions, auth routes, Swagger metadata, and credentialed CORS configuration.
- [ ] Run focused tests and the complete server test suite.

### Task 2: Admin app foundation and session flow

**Files:**
- Create the Vite app and config under `admin/`, including `package.json`, `index.html`, TypeScript/Tailwind config, router, API client, query provider, login route, and protected layout.
- Add frontend tests for money conversion and session/API behavior.

**Interfaces:**
- API base URL is configurable as a non-secret public URL; Axios always uses `withCredentials: true`.
- `POST /auth/admin` accepts the key only in the login request body; no persistence or Vite key variable.
- `GET /auth/admin/me` gates protected routes; 401 navigates to `/login`.

- [ ] Write and run failing tests for reais-to-centavos conversion, cents formatting, and 401 handling.
- [ ] Scaffold the requested Vite/React/TS/Tailwind dependencies and reusable shadcn-style UI primitives.
- [ ] Implement login, protected routing, shared app layout, and API/query clients.
- [ ] Run frontend tests and production build.

### Task 3: Product and category management

**Files:**
- Create product list, product editor, category CRUD, and image-upload components/routes in `admin/src/`.
- Extend frontend tests for form payload conversion and status/page query behavior.

**Interfaces:**
- Product reads use `/api/admin/products`; existing guarded create/update/delete operations use `/api/products`. Prices are centavos and variants carry SKU, size, color, stock, and availability.
- Product list query uses status, page, and limit; category CRUD uses existing `/api/categories` endpoints.
- Image uploader uses `/api/upload` and appends the returned URL to `images[]`.

- [ ] Write and run failing tests for price payloads, status filter/page parameters, and variant serialization.
- [ ] Implement product table, status filter, pagination, create/edit forms, upload URL handling, category CRUD, and delete/archive confirmations.
- [ ] Run frontend tests, lint, and production build.

### Task 4: Final verification and review

**Files:**
- Update `server/README.md` with admin origin/session configuration and routes; add admin run/build instructions in `admin/README.md`.

- [ ] Run server build, lint, and tests.
- [ ] Run admin build, lint, and tests.
- [ ] Confirm `git diff -- client/` is empty relative to the starting tree.
- [ ] Review changed files against the spec and report all actual verification results.

