# Good First Issues

A starting backlog, grounded in real gaps found during the
[repository audit](../audits/current-state.md) and the
[roadmap](../../ROADMAP.md) — not padding. File these as GitHub issues
using the labels noted; feel free to pick one and open a PR directly,
referencing this doc.

## good first issue

1. **Add an empty state to the orders table.** `components/orders/client.tsx`
   renders nothing distinguishable when a store has zero orders. Add a
   simple "No orders yet" state, consistent with how other list views
   (products, categories) already handle it — check if they do; if they
   don't either, fix all of them together.
2. **Improve product form error messages.** Several validation error
   strings in `app/api/[storeId]/products/route.ts` are terse (`"price is
required"`) and inconsistent in casing/punctuation across resources.
   Normalize them.
3. **Fix the copy-pasted "BILLBOARD_PATCH" console.log label in the
   category route.** `app/api/[storeId]/categories/[categoryId]/route.ts`
   logs `'BILLBOARD_PATCH :'` in its category PATCH handler's catch
   block — leftover from copy-pasting the billboard route. Fix the label,
   or better, remove the `console.log` entirely per the DX cleanup below.
4. **Add a healthcheck to the Dockerfile / docker-compose.** The app
   container has no `HEALTHCHECK`; add one hitting a lightweight route.
5. **Wire up or remove the commented-out revenue graph.** The dashboard
   page (`app/(dashboard)/[storeId]/(routes)/page.tsx`) fetches
   `graphData` every load but never renders `<Overview data={graphData}
/>` — it's commented out. Either finish wiring it (it looks
   functional) or remove the dead fetch. Needs a maintainer decision
   first if you're unsure which — see the audit's technical debt section.

## help wanted

6. **Remove leftover `console.log` debug statements from route handler
   catch blocks.** Several exist across `app/api/[storeId]/**` (some
   already commented out) — clean them all up in one pass.
7. **Add loading skeletons to the dashboard list pages** (products,
   categories, sizes, billboards) instead of a blank flash while data
   loads.
8. **Audit and fix `next.config.js`'s `images.remotePatterns`** — the app
   hardcodes `res.cloudinary.com`; if a `StorageProvider` abstraction
   (ROADMAP v0.4) lands, this needs to become configurable instead.
9. **Upgrade the `stripe` SDK 13.5.0 → current, one major at a time.**
   Ten majors behind (our pinned `apiVersion` in `lib/stripe.ts` is
   `2023-08-16`). Not routine — v21+ changes monetary fields from
   strings to a `Stripe.Decimal` type (affects this app's checkout line
   items and webhook amount handling directly), and v23 changes webhook
   tolerance/connection-error behavior. Review the changelog at each
   major (`github.com/stripe/stripe-node/wiki`) rather than jumping
   straight to latest. Needs the same real-HTTP/webhook verification
   rigor as the Next.js/Clerk upgrades in `CHANGELOG.md`.

## frontend

10. **Add a confirmation step showing what will be deleted** in the alert
    modal (`components/modals/alertModal.tsx`) — currently a generic "Are
    you sure?" regardless of resource type or its dependents (e.g.
    deleting a billboard that categories still reference).
11. **Make the store switcher keyboard-navigable** and verify it meets
    basic accessibility expectations (focus states, ARIA labels) —
    `components/store-switcher.tsx`.

## backend

12. **Add pagination to the products/categories/sizes/billboards list
    endpoints.** They currently return every row for a store with no
    `take`/`skip`, unlike the orders endpoint which already does `take:
20`. This will matter once the seed data (or a real store) has more
    than a couple dozen rows.

## database

13. **Add `storeId` compound indexes** (`@@index([storeId])`) to
    Billboard, Category, Size, and Product in `prisma/schema.prisma` —
    every list query filters by `storeId` and none currently has an index
    hint beyond the default `_id`.
14. **Write the money-model migration script** (v0.3, see ROADMAP) —
    `price: Float` → `priceCents: Int` + `currency: String`, with a
    one-time backfill (`priceCents = round(price * 100)`, `currency =
"USD"`). Needs an RFC-adjacent write-up in the PR description since it
    touches every price read/write in the app.

## testing

15. **Add integration tests for the `stores` API** — `app/api/stores/**`
    has no test coverage yet, unlike the four resources covered in
    `tests/integration/*-authorization.test.ts`.
16. **Write the authenticated Playwright e2e journey**: sign up → create
    store → create category → create product → view product → create/
    order fixture → view order. A config and one unauthenticated smoke
    test already exist (`playwright.config.ts`, `tests/e2e/auth.spec.ts`)
    — this needs Clerk's testing-token support (`@clerk/testing`) and a
    configured Clerk test instance to drive a real signed-in session.

## documentation

17. **Document the Stripe local-testing workflow** (`stripe listen
--forward-to`) in `docs/getting-started/README.md` — currently
    assumes the reader already knows the Stripe CLI.
18. **Add a diagram of the checkout → webhook → order flow** to
    [docs/architecture/payments.md](../architecture/payments.md) —
    currently prose-only.

## integration

19. **Add a `PayPal` `PaymentProvider` implementation** — blocked on the
    v0.4 provider interface landing first (see
    [docs/architecture/integrations.md](../architecture/integrations.md));
    good to pick up once that's merged.
20. **Add an `M-Pesa` `PaymentProvider` implementation** — same
    dependency as above; a real driver for a market this project's
    seed data (Tanzania/Kenya addresses) already nods toward.

## security

21. **Add rate limiting to the public checkout endpoint** — it's
    currently open (CORS `*`, no auth) with no request throttling.

## RFC

22. **RFC: Product variants architecture** — see
    [docs/architecture/commerce-domain.md](../architecture/commerce-domain.md);
    needs a written proposal before v0.3 implementation starts.
23. **RFC: Organizations and team roles** — see
    [docs/architecture/multi-tenancy.md](../architecture/multi-tenancy.md);
    a real authorization-model change, needs sign-off before code.
