# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

MVP inference: the store operator manages clothing products, categories, images, prices, and variant inventory through a separate admin panel.

## Product Purpose

MVP inference: the clothing store sells apparel online; the admin panel supports maintaining its product catalogue.

## Capabilities and Constraints

- Confirmed: an admin app lives in `admin/`, separate from `client/`.
- Confirmed: the backend lives in `server/` and supports `@Admin()` API-key authorization.
- Confirmed: the admin API key must never be sent to or stored in the browser; login exchanges it for an HttpOnly, Secure, SameSite=Strict cookie.
- Confirmed: this MVP admin scope covers product and category management, image upload, and admin session management.
- Confirmed: no customer login, orders, dashboard, or reports are in scope.
- Inference: the admin is operated by a small store team on desktop and mobile browsers.

## Product Principles

- Keep the admin session secret out of browser-readable storage.
- Make catalogue and inventory edits direct and recoverable.
- Keep admin tools isolated from the customer storefront.
