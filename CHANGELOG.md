# Changelog

All notable changes to this project are documented here. Format loosely
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Security

- Fixed a cross-store authorization (IDOR) vulnerability in the billboards,
  categories, sizes, and products APIs: `PATCH`/`DELETE` handlers verified
  the caller owned _some_ store but did not verify the target resource
  belonged to _that_ store, letting a user mutate or delete another store's
  data by id. Added regression tests (`tests/integration/*-authorization.test.ts`).
- Stripe webhook now returns `400` (was `500`) on an invalid signature, so
  Stripe's retry behavior doesn't keep resending a forged payload.
- Fixed the storefront checkout endpoint (`app/api/[storeId]/checkout/route.ts`)
  creating an order from another store's products: it fetched products by
  id with no `storeId` filter, and built order items from the raw
  unvalidated ids rather than the validated products. Now rejects the
  request with `400` if any id doesn't belong to the requested store.
  Added `tests/integration/checkout-authorization.test.ts`.
- Added Stripe webhook replay/idempotency protection: a retried delivery
  of `checkout.session.completed` (Stripe retries on a slow/failed
  response) no longer re-marks an order paid or re-archives its products.
  New `ProcessedWebhookEvent` model, keyed by Stripe's `event.id`. Added
  `tests/integration/webhook-idempotency.test.ts`.

### Changed

- Bumped Next.js 13.4.19 → 13.5.11 (prerequisite for the Clerk upgrade
  below — same major, no breaking changes).
- Migrated Clerk v4.23.3 → v6.39.6: `middleware.ts` rewritten for
  `clerkMiddleware`/`createRouteMatcher` (v4's `authMiddleware` was
  removed), `auth()` is now async and imported from
  `@clerk/nextjs/server`. Verified the resulting middleware behavior
  against a running Docker container (not just tests) — see
  `docs/architecture/authentication.md`. Required adding
  `experimental.serverActions` to `next.config.js` and a build-time
  `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (documented in `Dockerfile` and
  `docs/deployment/README.md`), since Clerk v6 needs both at build time
  in ways v4 didn't.

### Added

- Repository audit: `docs/audits/current-state.md`.
- Testing: Vitest, cross-store authorization test suite, Playwright scaffold.
- Tooling: `typecheck`, `test`, `format`, `db:migrate`/`db:seed`/`db:reset`
  npm scripts; Prettier configuration.
- Open-source foundation docs: README rewrite, LICENSE (MIT), CONTRIBUTING,
  CODE_OF_CONDUCT, SECURITY, ARCHITECTURE, ROADMAP, AGENTS.md.
- Local development: `docker-compose.yml` (MongoDB replica set),
  `Dockerfile`, `prisma/seed.ts` demo data.

### Fixed

- Removed a copy-pasted "Billboard ID is required" error string from the
  product delete handler.
- Removed the duplicate, unused `tailwind.config.ts` stub — `tailwind.config.js`
  (referenced by `components.json`) remains the single source of truth for
  the design system tokens.
- `OrderItem` now tracks real quantity (`quantity Int @default(1)`)
  instead of implicitly assuming 1 per line item — every revenue/order-
  total calculation was silently wrong whenever a customer changed
  quantity in Stripe's adjustable-quantity checkout UI. Backfilled via a
  new `stripeLineItemId` join key set at checkout time and resolved to
  the final quantity at webhook time. See
  `docs/architecture/commerce-domain.md`. Added
  `tests/unit/actions.test.ts` (previously zero coverage on this math).

## [0.1.0] — prior history

Everything before this changelog existed: the original ecommerce admin
dashboard (Next.js 13, Clerk, Prisma/MongoDB, Stripe, Cloudinary) — see
`git log` for the detailed history.
