# Authorization

## The model

A `Store` has exactly one owning `userId` (a Clerk user id). Every
mutating route must prove two things, not one:

1. **The caller owns _a_ store matching the `storeId` in the URL** —
   `prismadb.store.findFirst({ where: { id: params.storeId, userId } })`.
2. **The specific resource being mutated belongs to _that same_ store** —
   the `storeId` on the target billboard/category/size/product row must
   match `params.storeId` too.

Step 1 alone is not sufficient. A user who owns Store A legitimately
passes step 1 for any request shaped `.../api/{store-A-id}/products/{any-product-id}`
— including a product id that actually belongs to Store B. Only step 2
prevents that request from mutating Store B's data.

## Why this is called out explicitly

Step 2 was missing from the billboards, categories, sizes, and products
routes until [docs/audits/current-state.md](../audits/current-state.md) §6
caught it — every `PATCH`/`DELETE` performed step 1, then ran an
`updateMany`/`deleteMany`/`update` scoped only by the resource's own id,
not by `storeId`. `app/api/stores/[storeId]/route.ts` never had this bug
(it checks `userId` directly in the same query), which is how the fix
pattern was derived.

**If you add a new store-scoped resource, both checks must be present**,
and `tests/integration/` must gain a test proving the cross-store negative
case for it — see the existing `*-authorization.test.ts` files for the
pattern (an in-memory fake Prisma delegate that does real `where`-clause
filtering, so the test genuinely fails against broken code).

## What's centralized vs. not

Nothing is centralized today — each route re-implements both checks
inline. [ROADMAP.md](../../ROADMAP.md) v0.5 plans a real permission system
(`product.read`, `order.refund`, etc.) once organizations/roles exist;
until then, don't invent a partial abstraction for just one resource type —
follow the existing inline pattern consistently rather than introducing a
one-off helper that only some routes use.

## Public (unauthenticated) reads

`GET` on a single billboard/category/size/product takes no `auth()` call
at all — this is intentional, treated as the public storefront-read
surface (a separate storefront app is expected to call these). It is not
scoped by store either, which is fine for a public read but means these
routes should never be extended to also handle a mutation without adding
the checks above.
