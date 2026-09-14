# Multi-Tenancy

## Today: one owner per store

`Store.userId` is a single Clerk user id. There is no organization, team,
or role concept — one person owns a store, full stop. A user can own
multiple stores (the store switcher supports this), but two users can
never share one.

## Where this is headed

[ROADMAP.md](../../ROADMAP.md) v0.5 plans:

```
Organization
├── Members (Owner / Admin / Manager / Staff)
└── Stores
```

This is a real data-model and authorization change, not a relabeling — it
needs its own RFC before implementation starts (see
[docs/rfcs/README.md](../rfcs/README.md)). Doing it early, before v0.3's
commerce-core changes land, would mean migrating the same rows twice.

## The platform constraint that shapes this: MongoDB via Prisma

This project uses MongoDB, accessed through Prisma. Three things about
that combination directly affect multi-tenancy, the money model, and local
development, and are easy to discover the hard way mid-implementation, so
they're recorded here:

1. **No `prisma migrate`.** The MongoDB connector only supports
   `prisma db push` — there's no generated migration history. `npm run
db:migrate` runs `db push` under that name for consistency with other
   Prisma-based projects, but there's no up/down file it produces.
2. **No `Decimal` type.** Prisma's `Decimal` scalar is not supported on
   the MongoDB connector. This is why [ROADMAP.md](../../ROADMAP.md) v0.3's
   money-model migration lands on integer minor units (`priceCents: Int`
   - `currency: String`), not `Decimal` — it's the only option available
     on this database, not a style preference.
3. **Replica set required for transactions.** Prisma needs MongoDB
   configured as a replica set — even a single local node — to support
   transactions and some nested writes. `docker-compose.yml` starts
   `mongod` with `--replSet rs0` and a one-shot `mongodb-init` service
   that calls `rs.initiate()`. A plain `mongo` container without this will
   fail on `npm run db:seed` (which does nested writes) in a way that
   won't reproduce against MongoDB Atlas (which is already a replica set).

## Is a Postgres migration on the table?

Not as a default action. See
[docs/rfcs/RFC-001-postgresql-migration.md](../rfcs/RFC-001-postgresql-migration.md) —
a real `Decimal` type and `prisma migrate` are both compelling arguments
_for_ Postgres, but a database migration is exactly the kind of
irreversible, high-blast-radius change that needs a written RFC and
maintainer sign-off before any code moves, not something to decide inside
an unrelated PR.
