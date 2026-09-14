# API

There is no versioned public API yet — that's
[ROADMAP.md](../../ROADMAP.md) v0.4 (`/api/v1/...` with standardized
pagination, filtering, and error envelopes).

## What exists today

Unversioned route handlers under `app/api/`, split into two groups:

- **Admin routes** (`app/api/stores`, `app/api/[storeId]/**` except
  `checkout`) — Clerk-authenticated, store-scoped, used by the dashboard
  UI itself. See [docs/architecture/authorization.md](../architecture/authorization.md)
  for the ownership rules every mutation enforces.
- **Public routes** — `GET` on a single billboard/category/size/product
  (no auth), and `POST /api/[storeId]/checkout` (no auth, CORS-open) —
  intended for a separate storefront client to call directly.

There is no consistent error envelope, pagination, or filtering
convention across these yet; each route does its own thing (see
[docs/audits/current-state.md](../audits/current-state.md) for specifics).

## Planned v1 conventions

```json
// success
{ "data": {}, "meta": {} }

// error
{ "error": { "code": "PRODUCT_NOT_FOUND", "message": "...", "details": {} } }
```

Plus API keys for server-to-server access (hashed at rest, never stored or
logged in plaintext after creation) and outgoing webhooks — see
[docs/architecture/integrations.md](../architecture/integrations.md) and
ROADMAP v0.4.
