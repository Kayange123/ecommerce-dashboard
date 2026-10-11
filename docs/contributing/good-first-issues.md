# Good First Issues

A starting backlog, grounded in real gaps found during the
[repository audit](../audits/current-state.md) and the
[roadmap](../../ROADMAP.md) — not padding. File these as GitHub issues
using the labels noted; feel free to pick one and open a PR directly,
referencing this doc.

## good first issue

1. **Fix the copy-pasted "BILLBOARD_PATCH" console.log label in the
   category route.** `app/api/[storeId]/categories/[categoryId]/route.ts`
   logs `'BILLBOARD_PATCH :'` in its category PATCH handler's catch
   block — leftover from copy-pasting the billboard route. Fix the label,
   or better, remove the `console.log` entirely per the DX cleanup below.
2. **Add a healthcheck to the Dockerfile / docker-compose.** The app
   container has no `HEALTHCHECK`; add one hitting a lightweight route.

## help wanted

3. **Migrate `@tanstack/react-table` 8 → 9.** A full API rewrite:
   `useReactTable`, `getCoreRowModel`, `getPaginationRowModel`, and
   `getFilteredRowModel` are all gone, and `ColumnDef` now takes 2–3 type
   arguments instead of 1 (confirmed via a real CI typecheck failure —
   see the closed Dependabot PR #40 and the ignore rule in
   `.github/dependabot.yml`). Touches every `components/*/Columns.tsx`
   (billboard, categories, orders, products, sizes) and
   `components/ui/dataTable.tsx`. Read the v9 migration guide fully before
   starting; this isn't a mechanical find-replace.
4. **Remove leftover `console.log` debug statements from route handler
   catch blocks.** Several exist across `app/api/[storeId]/**` (some
   already commented out) — clean them all up in one pass.
5. **Audit and fix `next.config.js`'s `images.remotePatterns`** — the app
   hardcodes `res.cloudinary.com`; if a `StorageProvider` abstraction
   (ROADMAP v0.4) lands, this needs to become configurable instead.
6. **Upgrade the `stripe` SDK 13.5.0 → current, one major at a time.**
   Ten majors behind (our pinned `apiVersion` in `lib/stripe.ts` is
   `2023-08-16`). Not routine — v21+ changes monetary fields from
   strings to a `Stripe.Decimal` type (affects this app's checkout line
   items and webhook amount handling directly), and v23 changes webhook
   tolerance/connection-error behavior. Review the changelog at each
   major (`github.com/stripe/stripe-node/wiki`) rather than jumping
   straight to latest. Needs the same real-HTTP/webhook verification
   rigor as the Next.js/Clerk upgrades in `CHANGELOG.md`.

## backend

7. **Add pagination to the products/categories/sizes/billboards list
   endpoints.** They currently return every row for a store with no
   `take`/`skip`, unlike the orders endpoint which already does `take:
20`. This will matter once the seed data (or a real store) has more
   than a couple dozen rows.

## database

8. **Add `storeId` compound indexes** (`@@index([storeId])`) to
   Billboard, Category, Size, and Product in `prisma/schema.prisma` —
   every list query filters by `storeId` and none currently has an index
   hint beyond the default `_id`.
9. **Write the money-model migration script** (v0.3, see ROADMAP) —
   `price: Float` → `priceCents: Int` + `currency: String`, with a
   one-time backfill (`priceCents = round(price * 100)`, `currency =
"USD"`). Needs an RFC-adjacent write-up in the PR description since it
   touches every price read/write in the app.

## testing

10. **Add integration tests for the `stores` API** — `app/api/stores/**`
    has no test coverage yet, unlike the four resources covered in
    `tests/integration/*-authorization.test.ts`.
11. **Write the authenticated Playwright e2e journey**: sign up → create
    store → create category → create product → view product → create/
    order fixture → view order. A config and one unauthenticated smoke
    test already exist (`playwright.config.ts`, `tests/e2e/auth.spec.ts`)
    — this needs Clerk's testing-token support (`@clerk/testing`) and a
    configured Clerk test instance to drive a real signed-in session.

## documentation

12. **Document the Stripe local-testing workflow** (`stripe listen
--forward-to`) in `docs/getting-started/README.md` — currently
    assumes the reader already knows the Stripe CLI.
13. **Add a diagram of the checkout → webhook → order flow** to
    [docs/architecture/payments.md](../architecture/payments.md) —
    currently prose-only.

## integration

14. **Add a `PayPal` `PaymentProvider` implementation** — blocked on the
    v0.4 provider interface landing first (see
    [docs/architecture/integrations.md](../architecture/integrations.md));
    good to pick up once that's merged.
15. **Add an `M-Pesa` `PaymentProvider` implementation** — same
    dependency as above; a real driver for a market this project's
    seed data (Tanzania/Kenya addresses) already nods toward.

## security

16. **Add rate limiting to the public checkout endpoint** — it's
    currently open (CORS `*`, no auth) with no request throttling.

## RFC

17. **RFC: Product variants architecture** — see
    [docs/architecture/commerce-domain.md](../architecture/commerce-domain.md);
    needs a written proposal before v0.3 implementation starts.
18. **RFC: Organizations and team roles** — see
    [docs/architecture/multi-tenancy.md](../architecture/multi-tenancy.md);
    a real authorization-model change, needs sign-off before code.
