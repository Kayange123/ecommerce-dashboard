# RFC-002: Prisma 8 MongoDB migration

## Status

Draft — not scheduled. Recorded so the decision to stop at Prisma 6 is
documented rather than silently implicit.

## Context

This app is on Prisma 6.x. Prisma's major-version cadence moved fast:
**Prisma 7 removed MongoDB support entirely** — `prisma.io`'s own upgrade
guide states "Prisma ORM v7 does not yet support MongoDB" and directs
MongoDB users either to stay on the latest Prisma 6.x release, or to move
directly from 6 to 8, skipping 7 altogether.

## Problem

Prisma 8's MongoDB support is not a version bump — it's a different
product surface for the parts of this app that touch the database:

- **Config model changes**: `datasource`/`provider` move out of
  `schema.prisma` into a `prisma.config.ts`-driven setup using
  `@prisma/orm-mongo`, rather than the schema-file-driven model this app
  (and `docs/architecture/multi-tenancy.md`) currently documents.
- **Collection addressing changes**: Prisma 8 addresses collections by
  storage name (the `@@map` name, or the lowercased model name) — e.g.
  `db.orm.stores`, not `db.orm.Store`.
- **The query API itself changes**: from
  `prisma.product.findMany({ where: { storeId } })` to a chained builder,
  e.g. `db.orm.products.where({ storeId }).many()`. This is not a
  drop-in replacement — **every Prisma call site in this app would need
  rewriting**: every route under `app/api/**`, `actions/actions.ts`,
  `prisma/seed.ts`, and the `tests/helpers/fakePrisma.ts` test double
  that mimics today's query shape.
- **Schema syntax changes**: id fields become
  `id ObjectId @id @map("_id")` (dropping `@default(auto())`), with new
  `@@discriminator`/`@@base` polymorphism support.
- **No transaction API for MongoDB yet** — Prisma 8's own docs describe
  this as still incomplete, meaning any nested-write code (this app's
  order + order-items creation, product + images creation) would need to
  fall back to the native MongoDB driver's session/transaction API in
  places Prisma currently handles transparently.

None of this is a "just bump the version" change. It's closer in scope
to the money-model migration planned for ROADMAP v0.3, arguably larger,
since it touches the data-access layer of literally every route rather
than one field.

## Proposed Solution

Not proposed here — deliberately deferred. If pursued, a follow-up RFC
needs to specify at minimum:

- Whether to adopt the `@prisma/orm-mongo` config model at all, given its
  own docs describe MongoDB support there as incomplete (no transactions).
- A concrete rewrite plan for every call site listed above — likely
  file-by-file, given the query API change is not mechanically
  codemod-able the way Next 15's async-params change was.
- A replacement strategy for `tests/helpers/fakePrisma.ts`'s query-shape
  assumptions, since the whole point of that helper (mimicking real
  Prisma call shapes so tests fail the same way the real code would) only
  holds if it mimics the _new_ API.
- How nested writes (checkout's order+orderItems, product+images) get
  transaction safety without Prisma's `transaction` method.

## Alternatives

- **Stay on Prisma 6.x indefinitely.** This is the default today. Prisma
  6 remains explicitly supported for MongoDB per Prisma's own guidance,
  and this app's usage (schema-driven models, `findMany`/`create`-style
  calls, `prisma db push`) is unremarkable — nothing here is at risk of
  losing support on 6.x on any specific known timeline.
- **Migrate off MongoDB to Postgres first** (RFC-001), then take whatever
  Prisma major is current for SQL databases at that time — sidesteps the
  MongoDB-specific v7/v8 disruption entirely, at the cost of RFC-001's own
  migration risk.

## Trade-offs

Staying on 6.x indefinitely risks eventually being multiple majors behind
if Prisma deprecates 6.x support on some future timeline — but attempting
the 8.x MongoDB migration now, while its own transaction support is
incomplete per Prisma's own documentation, means building on ground
Prisma itself hasn't finished pouring.

## Migration

Not designed — this is exactly what a follow-up to this RFC would need to
specify, informed by how complete Prisma's MongoDB support on 8.x becomes
in the meantime.

## Open Questions

- Is there a real forcing function (a security patch only shipped for 8+,
  a feature this app needs that 6.x lacks) or is staying on 6.x
  indefinitely genuinely fine?
- Does Prisma 8's MongoDB transaction support mature before this becomes
  worth revisiting? Re-check Prisma's own docs before starting any
  follow-up RFC, rather than trusting this document's snapshot of it.
