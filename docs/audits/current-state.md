# Current State Audit

**Date:** 2026-09-14
**Scope:** Full repository assessment prior to any structural change, per the open-source transformation plan.
**Method:** Manual read-through of every route, schema, and config file; `npm install`, `npx tsc --noEmit`, and `npm run build` run against the unmodified tree to establish a working baseline.

**Baseline result:** `npm install` succeeds (525 packages, 30 audit findings — see [Dependency risks](#dependency-risks)). `npx tsc --noEmit` passes with zero errors. `npm run build` succeeds and emits 27 routes. **The app currently builds and typechecks cleanly.** Any regression introduced during modernization is a real regression, not a pre-existing break — there is no "already broken" excuse available.

---

## 1. Current architecture

A single Next.js 13 (App Router) application, deployed as one Vercel-style monolith:

```
Admin Dashboard (Next.js App Router, React 18, Tailwind, Radix/shadcn-derived UI)
        │
        ├── app/(auth)      — Clerk sign-in/sign-up
        ├── app/(root)      — store picker / bootstrap
        ├── app/(dashboard) — per-store admin UI, path-scoped by [storeId]
        └── app/api         — REST-ish route handlers, same [storeId] scoping
                │
                ▼
        lib/prismadb.ts — singleton PrismaClient
                │
                ▼
        MongoDB (Atlas), via Prisma's Mongo connector
                │
        ┌───────┴────────┐
        ▼                ▼
     Stripe          Cloudinary
  (checkout +      (image upload,
   webhook)         next-cloudinary)
```

- **Auth:** Clerk (`@clerk/nextjs` v4, legacy `authMiddleware` API). `middleware.ts` marks `/api/:path*` as a Clerk _public route_ — Clerk performs no enforcement on API routes at all. Every route handler calls `auth()` itself and hand-checks `userId`. This is the single biggest architectural fact in the repo: **there is no centralized authorization layer**; correctness depends on every handler remembering to re-derive it.
- **Multi-tenancy today:** one dimension only — `Store.userId` is a raw Clerk user id. There is no organization/team concept; a store has exactly one owner, full stop.
- **Data layer:** Prisma 5 against MongoDB. Every model uses `@map("_id") @db.String` with app-generated UUIDs (not native `ObjectId`) — a deliberate-looking choice, probably to keep IDs portable, but it forgoes Mongo's native id indexing.
- **Money:** `Product.price` is `Float`. No currency field anywhere; `USD` is hardcoded in `checkout/route.ts:42`.
- **Payments:** Stripe Checkout Sessions only. Order state is a single `Order.isPaid: Boolean`. No `Payment`, `PaymentAttempt`, or `Refund` model.
- **Storage:** Cloudinary, invoked directly from the domain layer via `next-cloudinary`'s `CldUploadWidget` in `components/ui/ImageUpload.tsx` — no storage abstraction.
- **UI:** Tailwind + a hand-rolled subset of shadcn/ui-style Radix wrappers in `components/ui/`, `@tanstack/react-table` for all list views, `zustand` for the one UI-only store-modal, `react-hook-form` + `zod` for every form.

## 2. Existing features (all confirmed working via build + read-through)

- Clerk auth (sign in / sign up / session).
- Multi-store creation and switching (`store-switcher.tsx`, store modal), scoped per authenticated user.
- Per-store CRUD: Billboards, Categories, Sizes, Products (with image gallery, `isFeatured`/`isArchived` flags, category/size relations).
- Order list (read-only) per store.
- Public storefront checkout API (`/api/[storeId]/checkout`) that creates a Stripe Checkout Session and a pending `Order`.
- Stripe webhook (`/api/webhook`) that marks an order paid and archives its products on `checkout.session.completed`.
- Dashboard KPI cards: total revenue, sales count, in-stock product count (`actions/actions.ts`).
- `ApiList` component surfacing the public GET endpoints for a resource, for a would-be separate storefront client to consume.

## 3. Strong points

- **The domain shape is basically right for a v0 admin.** Store → Category/Billboard/Size → Product → Image, and Order → OrderItem → Product, are sane starting relations; nothing here needs to be thrown away, only extended (§14 of the plan: variants/SKUs/inventory layer on top of `Product`, not instead of it).
- **Consistent per-request auth pattern.** Every admin mutation does check `auth()` and re-derives store ownership from the DB (not from a client-supplied claim) before writing. The pattern is duplicated, not absent — that's a refactor, not a rewrite.
- **Clean baseline.** Typechecks and builds with zero errors on a fresh install; no dead build artifacts committed; `.gitignore` is sane.
- **Form validation is already real**, not decorative — every mutating form uses `zod` schemas with `react-hook-form` + `@hookform/resolvers`, which upgrades cleanly to newer Next/React.
- **No secrets committed.** `.env.example` documents every variable with no real values filled in.

## 4. Architecture issues

1. **No centralized authorization.** Store-ownership checks are copy-pasted into every route handler (`app/api/[storeId]/**/route.ts`) instead of living in one policy/service layer. This is the direct cause of the IDOR class in §6 below — the duplication isn't just ugly, it's where the bugs live.
2. **No service/domain layer.** Route handlers talk to Prisma directly; validation, authorization, and persistence are interleaved in one function per HTTP verb. There is no `modules/catalog`, `modules/orders`, etc. — everything is `app/api`.
3. **Payment status is a boolean.** `Order.isPaid` cannot represent `PENDING → PROCESSING → PAID → REFUNDED`, cannot dedupe a Stripe webhook retry, and has no idempotency key.
4. **No inventory concept.** `Product` has no stock quantity; "sold out" is approximated by manually toggling `isArchived` from the webhook handler (`app/api/webhook/route.ts:52-61`) when an order completes — every purchased product is archived (removed from sale) regardless of quantity ordered vs. quantity in stock, because there is no quantity anywhere.
5. **`OrderItem` has no `quantity`.** Stripe's line items are created with `adjustable_quantity: { enabled: true }` (`app/api/[storeId]/checkout/route.ts:49-52`), but `OrderItem` only stores a `productId` — so a customer who buys 3 units of one product creates one `OrderItem` row and every revenue/order-total calculation (`actions/actions.ts:23-28`, `orders/page.tsx` `totalPrice` reducer) sums `product.price` **once per line item, not once per unit**. This is a live, current-code correctness bug, not a hypothetical: today, changing quantity at Stripe checkout silently undercounts revenue and the admin order total.
6. **Storefront checkout is not tenant-scoped.** `checkout/route.ts:26-35` fetches `products` by `id` only, with no `storeId` filter, then writes `storeId: params.storeId` onto the new `Order` regardless of which store the products actually belong to. Combined with `Access-Control-Allow-Origin: "*"`, a checkout request against Store A's endpoint can be paid for with Store B's product IDs, producing an Order recorded against the wrong store.
7. **Cloudinary is not abstracted.** `ImageUpload.tsx` couples the product/billboard forms directly to `next-cloudinary`'s widget; swapping to S3 or local dev storage means touching every form component, not one provider file.
8. **Stripe is not abstracted either.** `lib/stripe.ts` is a bare SDK client re-exported and imported directly in the checkout route and webhook handler — there is no `PaymentProvider` interface a second provider (M-Pesa, PayPal, etc.) could implement against.
9. **Duplicate Tailwind config.** Both `tailwind.config.js` (has the full shadcn CSS-variable theme: colors, radius, `tailwindcss-animate`) and `tailwind.config.ts` (a bare `create-next-app` stub with none of that) exist side by side. Next/PostCSS resolves `tailwind.config.js` first, so the `.ts` file is currently dead weight — but it is genuinely dead, not a harmless duplicate: naively deleting the `.js` in favor of the `.ts` (the more "modern" file) would silently strip the entire design system.

## 5. Technical debt

- Inconsistent error handling: some handlers return `500` for a client error (e.g. **the Stripe webhook returns `500` on a bad signature** — `app/api/webhook/route.ts:19-22` — which is wrong twice over: it should be `400`, and returning `5xx` for an invalid/forged signature tells Stripe's retry logic to keep resending the same forged payload).
- `console.log` debug statements left in production error paths (e.g. `app/api/[storeId]/categories/[categoryId]/route.ts:52`, several others), several already commented out rather than removed — signals these were debugged live against production and never cleaned up.
- Copy-pasted error strings with wrong resource names (`"Billboard ID is required"` inside the **product** DELETE handler — `app/api/[storeId]/products/[productId]/route.ts:79` — a leftover from copy-pasting the billboard route).
- Dashboard's headline feature is half-landed: the most recent commit (`6a3e610`, "implementation of graph visualization on the dashboard") added `getGraphRevenue` and the `Overview` bar-chart component, but the render call is commented out — `app/(dashboard)/[storeId]/(routes)/page.tsx`: `{/* <Overview data={graphData} /> */}`. `graphData` is fetched every page load and then thrown away. This needs a product decision (finish wiring it, or delete the dead fetch) before it's touched further — flagged here rather than assumed.
- Two Tailwind configs (see above) — pick one, fold the other's differences in, delete the loser.
- `tsconfig.json` targets `es5` on a Next 13 app that only ships to modern browsers via Next's own transpilation target — no functional bug, but it's a stale default from `create-next-app` circa 2022 worth revisiting during the TS/Next upgrade.

## 6. Security concerns

**Critical — broken cross-store authorization (IDOR), confirmed by direct code read, present in every resource except `Store` itself:**

| Resource  | File                                                  | Handlers affected                                         |
| --------- | ----------------------------------------------------- | --------------------------------------------------------- |
| Billboard | `app/api/[storeId]/billboards/[billboardId]/route.ts` | `PATCH` (updateMany at :32), `DELETE` (deleteMany at :71) |
| Category  | `app/api/[storeId]/categories/[categoryId]/route.ts`  | `PATCH` (updateMany at :35), `DELETE` (deleteMany at :74) |
| Size      | `app/api/[storeId]/sizes/[sizeId]/route.ts`           | `PATCH` (updateMany at :35), `DELETE` (deleteMany at :74) |
| Product   | `app/api/[storeId]/products/[productId]/route.ts`     | `PATCH` (update at :30/:47), `DELETE` (deleteMany at :89) |

The pattern in every case: the handler checks `prismadb.store.findFirst({ where: { id: params.storeId, userId } })` to confirm the _caller_ owns the store named in the URL — then performs the actual mutation `where: { id: params.<resource>Id }`, **without also constraining by `storeId`**. A user who owns _any_ store can PATCH or DELETE a billboard/category/size/product belonging to a _different_ store, by calling e.g. `PATCH /api/{their-own-storeId}/products/{someone-elses-productId}` — their own-store check passes, and the update targets the other store's row by id alone. `Store` itself (`app/api/stores/[storeId]/route.ts:19-27`, `:46-52`) does this correctly — it includes `userId` directly in the `updateMany`/`deleteMany` `where` clause — proving the fix is a known-good pattern already in the codebase, just not applied consistently.

This is exactly the vulnerability class §6 of the transformation plan asks to be tested for explicitly ("User belonging to Store A must NOT be able to access Store B's products/categories/orders/settings/analytics") — it is not hypothetical, it is present today.

**Other confirmed findings:**

- **Public GETs are unscoped by design, worth confirming as intentional.** `GET` on a single product/category/size/billboard (e.g. `products/[productId]/route.ts:102-124`) takes no auth and no store check at all — reasonable if these are meant as the public storefront-read API, but currently indistinguishable from "someone forgot the check" because there's no versioned/labeled public API surface (see plan §21).
- **Checkout has no tenant scoping** (architecture issue #6 above) — also a security finding: it lets a request against one store's checkout endpoint create a paid order using another store's product data.
- **Webhook has no replay/duplicate protection.** No `event.id` is persisted or checked; Stripe's own retry behavior on a slow response will double-run the "mark paid + archive products" side effects. No idempotency key on `Order`.
- **Webhook signature failure returns `500`, not `400`** — see Technical Debt; also a security-relevant detail since it affects Stripe's retry behavior on bad/forged signatures.
- **CORS is wildcard-open** (`Access-Control-Allow-Origin: "*"` in `checkout/route.ts:8`) with no companion rate limiting or origin allowlist — acceptable for a public storefront API in isolation, risky paired with the missing tenant scoping above.
- **`npm audit`: 30 known vulnerabilities** in the current dependency tree (3 low / 7 moderate / 17 high / 3 critical) — see [Dependency risks](#dependency-risks) for what's actually exploitable vs. transitive noise.
- No rate limiting anywhere (checkout, webhook, or admin mutation endpoints).
- No audit log for sensitive admin actions (product delete, settings change, etc.) — plan §28 is a clean addition, not a fix.

## 7. DX problems

- **No `AGENTS.md`, `CONTRIBUTING.md`, `ARCHITECTURE.md`, `SECURITY.md`, `LICENSE`, or `.github/` directory at all.** A new contributor (human or AI agent) has zero onboarding material beyond a generic `create-next-app` README.
- **No `.env.example` fallback story.** Every integration (Clerk, Stripe, Cloudinary, MongoDB Atlas) requires a real external account before `npm run dev` produces a usable app — there is no local/dev-mode fallback for any of them.
- **No Docker/Compose setup** — MongoDB is Atlas-only today; there's no way to spin up a local database.
- **No seed script** — a fresh clone has an empty database and no path to a populated one.
- **`package.json` has only 5 scripts** (`dev`, `build`, `start`, `lint`, `postinstall`) — none of `typecheck`, `test`, `format`, `db:migrate`/`db:push`, `db:seed` exist.
- **ESLint config is the bare `next/core-web-vitals` default** — no Prettier, no import-order rule, nothing repo-specific.
- Two Tailwind configs (again) is itself a DX trap: a contributor editing theme tokens has a 50/50 chance of editing the file that isn't loaded.

## 8. Testing gaps

**There are zero tests in the repository** — no unit, integration, or e2e test exists, and no test runner is installed. Concretely, none of the following currently have any coverage, and all are called out by name in the transformation plan:

- Authentication/authorization boundaries (and the cross-store IDOR above would have been caught by exactly the tests §6 of the plan asks for).
- Product/category/size/billboard CRUD and validation failures.
- Order retrieval and cross-store access prevention.
- Webhook signature validation, duplicate delivery, payment idempotency.
- Any end-to-end user journey (login → store → category → product → order).

## 9. Dependency risks

Stack is roughly **three years behind current** as of this audit (Sep 2026):

| Package                     | Current | Concern                                                                                                                                                                                                                                       |
| --------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `next`                      | 13.4.19 | Next 13 App Router was still stabilizing; missing 3 major versions of fixes, partial prerendering, etc. Upgrade path 13→14→15→(16) has real breaking changes at each hop (`next/font`, middleware `matcher`, caching defaults changed 14→15). |
| `@clerk/nextjs`             | ^4.23.3 | Uses the **removed** `authMiddleware` API (`middleware.ts:1,6`). Clerk v5/v6 replaced this with `clerkMiddleware`. This is a breaking migration, not a bump — budget real time for it.                                                        |
| `react` / `react-dom`       | 18.2.0  | React 19 changes `useFormState`, ref handling, and is required by Next 15+. Coupled to the Next upgrade.                                                                                                                                      |
| `@prisma/client` / `prisma` | ^5.2.0  | Prisma 6 exists; migration is generally low-risk but must be re-validated against the Mongo connector specifically (see below).                                                                                                               |
| `zod`                       | ^3.22.2 | Zod 4 has breaking changes to error customization API used throughout the `react-hook-form` resolvers.                                                                                                                                        |
| `tailwindcss`               | 3.3.3   | Tailwind 4 is a full engine rewrite (CSS-first config, no more `tailwind.config.js` as the primary mechanism) — should be sequenced _after_ the config-file duplication is resolved, not before.                                              |
| `eslint`                    | 8.48.0  | ESLint 9's flat-config is required by current `eslint-config-next` majors — coupled to the Next upgrade.                                                                                                                                      |
| `stripe`                    | ^13.5.0 | Several majors behind; API version pinned in code (`lib/stripe.ts:5`, `"2023-08-16"`) so upgrading the SDK requires deliberately re-pinning and re-testing the API version, not just a version bump.                                          |

`npm audit` reports 30 vulnerabilities (17 high, 3 critical) on the current lockfile — these should be re-run and triaged (not blindly `audit fix --force`ed) once the major-version upgrade sequence begins, since several will resolve themselves as transitive deps move with Next/Clerk majors.

## 10. Contributor onboarding problems

Beyond the missing docs files listed in §7: there is no way today for a new contributor to reach a _running, populated_ app without personally provisioning a MongoDB Atlas cluster, a Clerk application, a Stripe account, and a Cloudinary account, and manually filling in seven+ environment variables with no guidance on what any of them do or which are safe to stub. This is the single largest barrier to the "open-source, developer-first" positioning the plan targets — it is a bigger blocker than any code-quality issue above.

## 11. A load-bearing platform constraint the plan doesn't mention: MongoDB via Prisma

This affects the money model (§15), migrations tooling (§5/§10), and the Docker Compose setup (§10), so it's recorded here rather than discovered mid-implementation:

- **`prisma migrate` is not supported on the Mongo connector** — only `prisma db push`. Any `db:migrate` script this project ships will actually run `prisma db push` under the hood; that should be stated explicitly in docs rather than implied by the script's name.
- **Prisma's `Decimal` scalar is not supported on MongoDB.** §15 of the plan offers a choice between `Decimal` and integer minor units — on this stack, only integer minor units (`priceCents: Int` + explicit `currency: String`) is actually available. This isn't a preference call; it's the only option, and should be documented as such.
- **Prisma transactions/nested writes on Mongo require a replica set**, even for a single local node. A plain single-node `mongo` Docker image will not satisfy Prisma's transaction requirements — the `docker-compose.yml` this plan asks for needs a `--replSet` flag plus an `rs.initiate()` step (a small init container or entrypoint script), or seeding/nested-write operations will fail against local Docker Mongo in a way that won't reproduce against Atlas.
- Staying on Mongo for the v0.2–v0.3 horizon is the pragmatic call; the plan's own §31 example issue list independently expects `[RFC] PostgreSQL migration` to be an _RFC_, not a default action — treat a Postgres migration as a documented, deferred decision (`docs/rfcs/`), not something this pass decides.

## 12. Recommended migration sequence

The plan's own numbering (§4 modernization before §6 testing) is worth deliberately reordering: upgrading Next 13→15+ and Clerk v4→v6 (a breaking API removal) with zero tests in place means an upgrade regression and a pre-existing bug become indistinguishable. Recommended order:

1. **This audit** (done).
2. **Tooling + CI skeleton** — package.json scripts (`typecheck`, `test`, `format`, `db:seed`, `db:push`), Prettier, Vitest, a minimal `ci.yml` that runs them. No dependency majors bumped yet.
3. **Cross-store authorization tests + the IDOR fix, together, in the same slice.** Write the failing test first (Store A cannot mutate Store B's product/category/size/billboard), fix the four route files, land it green in CI. This is the one security fix that should happen _before_ the broader open-source push, independent of everything else.
4. **Open-source foundation** — README rewrite, LICENSE (MIT), CONTRIBUTING/CODE_OF_CONDUCT/SECURITY/ARCHITECTURE/ROADMAP/AGENTS.md, `.env.example` completion, Docker Compose (with the Mongo replica-set caveat above), seed script.
5. **Dependency upgrades, one major at a time**, each followed by `install → lint → typecheck → test → build`: Clerk v4→v6 first (breaking API, isolate it), then Next 13→14→15, then React 18→19, then Zod/Tailwind/ESLint majors.
6. **Domain/module restructuring** (§13) and **money model migration to integer minor units** (§15/§11) — once tests exist to catch regressions and the stack is current.
7. **Everything else in the plan's own v0.3+ roadmap** (variants/SKUs/inventory, order lifecycle, payment domain, provider abstractions, versioned API, webhooks, multi-tenancy/RBAC, promotions) — as separate, sequenced phases, each gated by the CI pipeline established in step 2.

Steps 3–4 are the two that most directly unblock the "production-minded, contributor-friendly" goal and should be prioritized over any cosmetic or dependency work.
