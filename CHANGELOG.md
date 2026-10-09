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
- Bumped TypeScript 5.2.2 → 6.0.3 and `tsconfig.json`'s `target` es5 →
  es2017 (TS6 treats ES5 as vanishing-legacy; TS7 drops it entirely).
  Surfaced and fixed a real, previously-silent gap: TS6's stricter
  side-effect-import checking (error TS2882) caught that Next.js's own
  shipped types never declared plain `*.css` imports (only
  `*.module.css`) — added `global.d.ts` with `declare module "*.css"`.
  **Deliberately not going to TypeScript 7**: its programmatic API (what
  `@typescript-eslint`/`eslint-config-next` and Next's own type-checking
  depend on) doesn't ship until 7.1 (~Nov 2026) — 7.0 is a Go-ported
  compiler with no JS-consumable API yet. `dependabot.yml` ignores
  typescript major-version bumps until that's re-evaluated.
- Bumped Next.js 15.5.25 → 16.4.0. `middleware.ts` renamed to `proxy.ts`
  (Next 16's new convention for the same `clerkMiddleware` code — see
  `docs/architecture/authentication.md`). `next lint` was removed
  entirely; migrated to the ESLint CLI with a flat `eslint.config.mjs`,
  deliberately matching the old `.eslintrc.json`'s exact ruleset
  (`eslint-config-next/core-web-vitals` only) rather than also adopting
  the newer, much stricter `eslint-config-next/typescript` preset, which
  surfaced ~75 unrelated pre-existing findings — that's a deliberate
  future cleanup, not an incidental part of this bump. Fixed 4 real
  lint errors from `eslint-config-next`'s own updated React Hooks rules
  (not from the stricter preset): a `setState`-in-`useEffect`
  "is this mounted" pattern repeated in 4 files, replaced with one
  shared `hooks/useIsMounted.ts` using `useSyncExternalStore` (avoids
  the extra render pass the old pattern caused); one of the four
  (`components/ui/ImageUpload.tsx`) had the pattern as fully dead code
  (its only use was already commented out) and was just deleted outright.
  **Verified behaviorally, and glad it was**: built the Docker image and
  hit the running container for the same signed-out-redirect check used
  for the Clerk v6 migration. With an abbreviated env var set (no
  `NEXT_PUBLIC_CLERK_SIGN_IN_URL` etc.), the redirect went to a
  Clerk-hosted Account Portal URL instead of this app's own `/sign-in` —
  matching a [known upstream Clerk issue](https://github.com/clerk/javascript/issues/8302)
  on Next 16's proxy. Setting those vars (which `.env.example` already
  does, pre-filled) fixed it. See `docs/architecture/authentication.md`
  for the full story — a real deployment following `.env.example` is
  unaffected, but this was worth tracking down rather than assuming
  green typecheck/test/lint/build meant the auth redirect still worked.
- Bumped `@clerk/nextjs` 6.39.6 → 7.9.13 (peer range confirmed to cover
  Next 16.4.0 and React 19.3.0 despite an oddly-narrow-looking upper
  bound in the published range — resolved cleanly, no ERESOLVE).
  Confirmed via grep that this app doesn't use any of v7's other
  breaking API changes (`<SignedIn>`/`<SignedOut>`/`<Protect>`,
  `useSignIn`/`useSignUp`, `handleRedirectCallback`, `getToken()`) —
  only two real breaking changes applied here: `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`/
  `_AFTER_SIGN_UP_URL` renamed to `_SIGN_IN_FALLBACK_REDIRECT_URL`/
  `_SIGN_UP_FALLBACK_REDIRECT_URL` (old names now silently ignored,
  confirmed by reading `@clerk/nextjs`'s own env-merge source —
  `.env.example` updated), and `<UserButton afterSignOutUrl>` removed
  in favor of a `<ClerkProvider afterSignOutUrl>`-level-only option
  (moved in `app/layout.tsx`, removed from both `<UserButton>` call
  sites in `components/MainNav.tsx`). Re-verified the full
  signed-out-redirect Docker check from the Next 16 commit against v7
  with the corrected env vars — same correct behavior. See
  `docs/architecture/authentication.md`.
- Bumped `zod` 3.25.76 → 4.6.5. Confirmed via grep this app's schemas
  (one per `*Form.tsx` component, plus `storeModal.tsx`) use none of
  v4's removed/changed APIs (no `.optional()+.default()` combinations,
  no `errorMap`/`required_error`/`invalid_type_error`, no `z.record()`,
  no deprecated string-format methods, no `.deepPartial()`/
  `.nonstrict()`) — the only non-trivial schema is `ProductForm.tsx`'s,
  already handled by the `z.input` fix from the `@hookform/resolvers`
  bump. Fixed one new real type error: `z.coerce.number()`'s input type
  is `unknown` (accepts anything pre-coercion), which doesn't match
  `<Input value>`'s prop type — added an explicit
  `value={field.value as string | number}` cast at that one call site
  rather than changing the schema-wide `z.input` typing choice.
  Verified: typecheck, all 27 tests, lint, build, and a full `docker
build` all pass.
- Bumped the Dockerfile's base image `node:20-alpine` → `node:24-alpine`
  — `24.x`, not Dependabot's suggested `25-alpine`, to match the
  `engines.node: "24.x"` already pinned in `package.json` for Vercel/CI
  rather than introduce a fourth different Node version across
  environments. CI doesn't build the Docker image at all, so this
  needed its own real verification, not just a green Dependabot check:
  built the image, ran the container, re-ran the same signed-out-
  redirect checks used for the Clerk/Next commits (all still correct),
  and confirmed no OpenSSL-detection warning in the logs (one had
  appeared on the original `node:20-alpine`).

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
