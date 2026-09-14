# AGENTS.md

Guidance for AI coding agents working in this repository. Read
[ARCHITECTURE.md](ARCHITECTURE.md) and
[docs/audits/current-state.md](docs/audits/current-state.md) first — they
explain _why_ things are structured the way they are, which this file
assumes.

## What this project is

A modular-monolith Next.js (App Router) admin dashboard for a commerce
platform, backed by MongoDB via Prisma, Clerk for auth, Stripe for
payments, Cloudinary for images. See [README.md](README.md) for the
product framing and [ROADMAP.md](ROADMAP.md) for where it's headed.

## Folder responsibilities

- `app/(dashboard)/[storeId]` — authenticated admin UI, one store at a time.
- `app/(auth)`, `app/(root)` — sign-in/sign-up and the store picker.
- `app/api/[storeId]/**` — admin mutation/read endpoints, scoped to a store.
- `app/api/stores`, `app/api/webhook` — store CRUD and the Stripe webhook.
- `components/` — UI. `components/ui/` is the shared primitive layer
  (Radix/shadcn-derived); resource folders (`components/products/`, etc.)
  are feature-specific.
- `lib/` — cross-cutting singletons (`prismadb.ts`, `stripe.ts`, `utils.ts`).
- `actions/actions.ts` — read-only dashboard aggregate queries. Don't grow
  this into a dumping ground; if you're adding real business logic, that's
  a signal a domain module (see ROADMAP v0.3+) is overdue, not that this
  file should get bigger.
- `prisma/schema.prisma` — the data model. `prisma/seed.ts` — demo data.
- `tests/unit`, `tests/integration`, `tests/e2e` — see
  [CONTRIBUTING.md](CONTRIBUTING.md#testing-expectations).
- `docs/audits/` — point-in-time assessments. Don't edit a past audit to
  reflect a fix you just made; note the fix in `CHANGELOG.md` instead and
  let the audit stay a historical snapshot.
- `docs/rfcs/` — design proposals for changes bigger than a single PR.

## Coding standards

- TypeScript, strict mode. `npm run typecheck` must pass.
- Prettier is the formatting authority (`npm run format`,
  `npm run format:check`) — don't hand-format against its output.
- Follow the existing per-route pattern for new API routes: parse and
  validate the body, check `auth()`, check store ownership, _then_ check
  that the specific resource being mutated belongs to that store (see
  "Security constraints" below — this second check is easy to forget and
  was a real vulnerability here).

## Commands

```bash
npm run dev
npm run build
npm run typecheck
npm run lint
npm run test              # npm run test:watch while iterating
npm run test:integration
npm run format:check
npm run db:migrate        # prisma db push — see "Database migration rules"
npm run db:seed
```

## Database migration rules

MongoDB via Prisma has **no migration history** — `db:migrate` runs
`prisma db push`, which applies the current schema directly with no
generated up/down files for a reviewer to read. If you change
`prisma/schema.prisma`:

- State the reasoning in the PR description, not just the diff — a
  reviewer can't infer intent from a schema diff the way they could from a
  migration file.
- `Decimal` is **not supported on the MongoDB connector** — don't add a
  `Decimal` field; use `Int` (minor units) or `String` if precision-safe
  serialization is genuinely needed.
- A field rename/removal is applied immediately and is lossy. Don't do a
  bare rename on a field that holds real data without proposing a backfill
  step in the same PR.
- Nested/transactional writes require MongoDB running as a replica set
  (the provided `docker-compose.yml` sets this up) — a plain single-node
  `mongod` will fail on some Prisma writes in a way that won't reproduce
  against Atlas.

## Security constraints — do not relax these

- **Every mutation to a store-scoped resource (billboard, category, size,
  product, and anything added later) must verify the resource's own
  `storeId` matches the store in the URL — not just that the caller owns
  _some_ store.** This was a real, fixed vulnerability
  (`docs/audits/current-state.md` §6); `tests/integration/*-authorization.test.ts`
  exists specifically to catch a regression here. If you add a new
  store-scoped resource or route, add the equivalent test.
- Don't relax the Stripe webhook's signature verification, and don't widen
  `Access-Control-Allow-Origin` beyond what's already there without
  discussing it — the checkout API is intentionally public but that's a
  narrow, deliberate exception, not a precedent.
- Don't log secrets (Clerk/Stripe/Cloudinary keys, webhook secrets, full
  request bodies containing them). `console.log` debug statements left in
  error paths are existing technical debt (see the audit) — clean them up
  when you touch a file, don't add new ones.

## Things agents must not change casually

- **`prisma/schema.prisma`** — a schema change affects the money model,
  multi-tenancy, and every route touching the changed model. Propose it,
  don't just make it, unless the task explicitly asked for a schema
  change.
- **`middleware.ts`** — it currently marks all API routes as Clerk-public
  by design (every route hand-checks auth itself); don't "fix" this by
  making routes Clerk-protected without also auditing every route's
  current auth logic for what would break.
- **`tailwind.config.js`** — this is the live config (`components.json`
  points at it); there is deliberately no `tailwind.config.ts` anymore
  (see CHANGELOG). Don't recreate a second config file.
- **Dependency major-version bumps** — see the audit's recommended
  migration sequence. Do these one at a time, each followed by
  `install → lint → typecheck → test → build`, not as a batch.

## Definition of done

A change is done when: `npm run typecheck`, `npm run lint`, `npm run test`,
and `npm run build` all pass; new behavior has a test; anything touching
authorization has a test proving the cross-store negative case; and the PR
description explains _why_, not just what changed.
