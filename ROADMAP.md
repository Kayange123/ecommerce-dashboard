# Roadmap

This roadmap is intentionally phased: each version should leave the app in
a runnable, tested state before the next one starts. See
[docs/audits/current-state.md](docs/audits/current-state.md) for the audit
this plan is sequenced from, and [docs/rfcs/](docs/rfcs/) for open design
questions that need a decision before a phase can start.

## v0.2 — Open Source Foundation _(in progress)_

- [x] Repository audit (`docs/audits/current-state.md`).
- [x] Cross-store authorization fix + regression tests.
- [x] Testing tooling (Vitest, Playwright scaffold), `typecheck`/`format`
      scripts.
- [x] License (MIT), README, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY,
      ARCHITECTURE, AGENTS.md.
- [x] Docker Compose for local MongoDB (replica set), Dockerfile.
- [x] Seed script with realistic demo data.
- [ ] CI pipeline (format → typecheck → lint → test → build), CodeQL,
      Dependabot, dependency review.
- [ ] Dependency modernization: Clerk v4 → v6, Next 13 → current, React 18
      → 19, one major at a time, each validated by the CI loop.

## v0.3 — Commerce Core

- Product variants, options, and SKUs.
- Inventory (`InventoryItem`, adjustments) — replacing the current
  "archive on purchase" stand-in.
- A `Customer` model, distinct from Clerk admin users.
- An explicit order lifecycle (`PENDING → CONFIRMED → PROCESSING →
FULFILLED / CANCELLED`) replacing `Order.isPaid: Boolean`.
- Money modeled as integer minor units + explicit currency (MongoDB's
  Prisma connector doesn't support `Decimal` — see the audit).

## v0.4 — Extensibility

- `PaymentProvider` / `StorageProvider` interfaces (Stripe and Cloudinary
  become the first implementations, not the only possible ones).
- API keys for server-to-server storefront access.
- A versioned public API (`/api/v1/...`) with consistent pagination,
  filtering, and error responses.
- Outgoing webhooks (`product.*`, `order.*`, `payment.*`) with signed
  payloads and delivery retry tracking.

## v0.5 — Teams

- Organizations and memberships (Owner/Admin/Manager/Staff).
- Centralized permission checks, replacing per-route ad hoc authorization.
- Audit log for sensitive actions.

## v0.6 — Growth

- Promotions, coupons, discount rules.
- Deeper analytics.
- Search.

## v0.7 — Integrations

- Additional payment providers (M-Pesa, PayPal, Paystack, Flutterwave,
  Pesapal, ...) built against the v0.4 `PaymentProvider` interface.
- S3-compatible storage as an alternative to Cloudinary.
- Email provider abstraction.

## v1.0

- Stable, documented public APIs.
- Documented extension points for third-party integrations.
- Migration guarantees between minor versions.
- A completed security review.

---

Have an idea that doesn't fit here? Open an
[RFC](docs/rfcs/README.md) or start a discussion.
