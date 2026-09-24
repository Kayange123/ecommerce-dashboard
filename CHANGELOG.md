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
- Bumped Next.js 13.5.11 → 14.2.35. Removed the `experimental.serverActions`
  flag added in the prior commit — Next 14 makes it the default and warns
  if the flag is left in. Bumped `next-cloudinary` 4.20.0 → 6.19.0 (v4's
  peer range didn't cover Next 14 at all).
- Bumped Next.js 14.2.35 → 15.5.25 and React 18.2.0 → 19.3.0 together
  (Next 15 requires React 19 as a peer). This was the largest step:
  Next 15 makes route `params`/`searchParams` `Promise`-based — ran
  `npx @next/codemod@canary next-async-request-api .` across all 22
  affected files, then manually updated the 5 test files that call
  route handlers directly with plain (non-Promise) `params` objects.
  `next.config.js`'s `images.domains` → `images.remotePatterns`.
  React 19 also forced version bumps through most of the UI dependency
  tree, since `npm ci` (used by CI/Docker, unlike a plain `npm install`)
  hard-fails on any unresolved peer conflict rather than warning: all 8
  `@radix-ui/react-*` packages, `@headlessui/react` 1→2 (`Dialog.Panel`
  is deprecated but still works in v2 — migrated `components/MainNav.tsx`
  to `DialogPanel` anyway), `cmdk` 0.2→1.1, `lucide-react` 0.274→1.46,
  `react-hook-form` 7.46→7.88, `@hookform/resolvers` 3→5 (which forced a
  `zod` patch bump to 3.25.76 to satisfy its peer range — staying on
  zod v3, not the v4 migration planned separately), `recharts` 2→3 (only
  used by the dashboard's dead/unrendered `Overview` component, so purely
  a peer-satisfying bump with zero behavioral risk), and `zustand` 4→5
  (verified `hooks/useStoreModal.ts`'s simple `create<T>((set) => ...)`
  pattern still works under v5). Also fixed a real type mismatch in
  `components/ProductForm.tsx` that a newer `@hookform/resolvers`
  surfaced: the form's type used `z.infer` (post-`.default()` output,
  required booleans) where it needed `z.input` (pre-parse, optional
  booleans) to match what `zodResolver` and `useForm` actually exchange.
  `next lint` now prints a deprecation notice (removed in Next 16) but
  still works. Verified: typecheck, all 27 tests, lint, `next build`,
  and (via `npm run start` rather than Docker, since this sandbox's
  Docker network reliably can't reach Google Fonts) the same real-HTTP
  Clerk middleware checks as the previous Clerk commit — still redirect
  to `/sign-in`, still return `401` from the app's own check on
  `/api/stores`, unchanged after this much larger jump.
- Bumped Prisma/`@prisma/client` 5.2.0 → 6.19.3. **Stopped there
  deliberately**: Prisma 7 dropped MongoDB support entirely, and Prisma
  8's MongoDB support replaces the schema-driven query API with a
  different chained-builder API and config model — not a routine bump.
  See `docs/rfcs/RFC-002-prisma-8-mongodb-migration.md`. Added
  `prisma.config.ts` to replace the now-deprecated `package.json#prisma`
  seed config; its mere presence disables Prisma's automatic `.env`
  loading, so it explicitly `import`s `dotenv/config` — confirmed via a
  real `prisma db push` against a `.env` file that this was necessary,
  not just theoretical. `dependabot.yml` now ignores major-version
  updates for `prisma`/`@prisma/client` so it stops re-suggesting the
  impossible-for-MongoDB Prisma 7 bump. Verified end-to-end against a
  real MongoDB replica set (`db push`, seed, idempotent re-seed, reset).

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
