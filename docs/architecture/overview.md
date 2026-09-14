# Architecture Overview

See [ARCHITECTURE.md](../../ARCHITECTURE.md) at the repo root for the
primary architecture document (layers, data model, external integrations,
and the roadmap direction). This `docs/architecture/` folder holds deeper
dives into specific concerns:

- [authentication.md](authentication.md) — how Clerk is wired in, and its
  current limits.
- [authorization.md](authorization.md) — the store-ownership authorization
  model, and the vulnerability class it needs to keep guarding against.
- [multi-tenancy.md](multi-tenancy.md) — the current one-owner-per-store
  model, the MongoDB/Prisma platform constraints, and where this is headed
  (organizations + roles).
- [commerce-domain.md](commerce-domain.md) — the product/order data model
  and its planned evolution (variants, inventory, order lifecycle).
- [payments.md](payments.md) — the current Stripe integration and its gaps
  (idempotency, refunds, the eventual provider abstraction).
- [integrations.md](integrations.md) — Cloudinary today, and the storage/
  payment/email provider interfaces planned for v0.4.
