# RFC-001: PostgreSQL migration

## Status

Draft — not scheduled. Recorded so the trade-off is visible rather than
decided implicitly by staying on MongoDB by default.

## Context

The app uses MongoDB via Prisma. [docs/architecture/multi-tenancy.md](../architecture/multi-tenancy.md)
documents three platform constraints this creates:

- No `prisma migrate` (only `db push`, no migration history).
- No `Decimal` scalar type (forces the money-model migration to integer
  minor units instead).
- Transactions/nested writes require a replica set, even locally.

## Problem

None of the above is _broken_ — integer minor units for money is a
legitimate, common choice independent of database, and `db push` is
workable for a project this size. The problem is narrower: **if this
project later wants relational integrity guarantees (real foreign keys,
enforced at the database, not just in application code) or a reviewable
migration history for a growing schema, MongoDB doesn't offer either.**

## Proposed Solution

Not proposed here. This RFC exists to record that the question was
considered and deliberately deferred — see [ROADMAP.md](../../ROADMAP.md),
which sequences a possible Postgres migration nowhere before v0.3
(commerce core) is stable, and only if a concrete need (not just a
platform preference) emerges.

If someone wants to pursue this, the actual RFC content — schema
translation plan, a dual-write or backfill migration strategy, and a
compatibility plan for `@map("_id") @db.String` UUIDs vs. native
relational primary keys — needs to be written and reviewed before any
code changes.

## Alternatives

- **Stay on MongoDB, accept the three constraints as permanent.** This is
  the default today and remains reasonable unless a concrete need for
  foreign-key integrity or migration history shows up.
- **Postgres from the start of v0.3**, timed with the money-model and
  commerce-core changes anyway, so data only moves once. Would need this
  RFC completed and accepted before v0.3 schema work starts.

## Trade-offs

Migrating databases mid-project is expensive and risky (data migration,
re-testing every query, re-validating the Docker/CI setup) — not a
decision to make inside an unrelated PR. Staying on MongoDB costs the
three constraints above indefinitely.

## Migration

Not designed — this is exactly what a follow-up to this RFC would need to
specify before any implementation starts.

## Open Questions

- Is there an actual forcing requirement (compliance, a specific relational
  query pattern, tooling) or is this purely a platform preference?
- If pursued, does it happen before or after v0.3's commerce-core schema
  changes?
