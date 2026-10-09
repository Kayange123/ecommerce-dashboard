# Authentication

[Clerk](https://clerk.com) (`@clerk/nextjs`) handles sign-up, sign-in, and
session management.

## How it's wired in

- `proxy.ts` uses Clerk v6's `clerkMiddleware` + `createRouteMatcher`
  (v4's `authMiddleware` was removed in v6). Unlike v4 — which protected
  everything _except_ `publicRoutes` by default — v6 protects nothing by
  default; the middleware explicitly calls `auth.protect()` for every
  route that doesn't match `isPublicRoute` (`/sign-in`, `/sign-up`,
  `/api/*`), reproducing v4's old behavior deliberately rather than
  accidentally inheriting v6's more permissive default.
- `/api/*` stays a matched "public route" for Clerk's own purposes, same
  as before — Clerk performs **no enforcement** on API routes. Every
  route handler under `app/api/` calls `await auth()` directly (async as
  of v6) and checks `userId` itself. This is a deliberate, if
  easy-to-misread, pattern: it's not that these routes are
  unauthenticated, it's that authentication is checked in application
  code rather than in middleware.
- `auth()` (and `currentUser()`, if used later) now lives at
  `@clerk/nextjs/server`, not the top-level `@clerk/nextjs` package —
  that package is now scoped to client-side pieces (`ClerkProvider`,
  `SignIn`, `SignUp`, `UserButton`).
- Dashboard pages (`app/(dashboard)/[storeId]/layout.tsx`) check
  `await auth()` server-side and `redirect('/sign-in')` if there's no
  `userId`.
- **Verified behaviorally** (not just by reading the migration guide):
  built the production Docker image and hit the running container
  directly. An unauthenticated request to `/` returns `307` to
  `/sign-in` with `x-clerk-auth-status: signed-out`, `/sign-in` itself
  returns `200` with no redirect loop, and an unauthenticated `POST
/api/stores` returns `401` from the route's own `auth()` check (not a
  Clerk-level block) — confirming the middleware reproduces v4's exact
  boundary. What this _couldn't_ verify without a real Clerk application:
  actual sign-up/sign-in completing, since that needs Clerk's real
  backend, not just a well-formed key.
- **`NEXT_PUBLIC_CLERK_SIGN_IN_URL` became load-bearing under Next.js
  16's `proxy.ts` convention** (renamed from `middleware.ts` — same
  `clerkMiddleware` code, see
  [ARCHITECTURE.md](../../ARCHITECTURE.md)). Discovered by the same
  Docker-container check above: omitting that env var (and
  `SIGN_UP_URL`/`AFTER_SIGN_IN_URL`/`AFTER_SIGN_UP_URL`) made the
  unauthenticated `/` redirect go to a Clerk-hosted Account Portal URL
  (`https://<key-derived-subdomain>.accounts.dev/sign-in`) instead of
  this app's own `/sign-in` page — the same failure mode as a
  [known upstream Clerk issue](https://github.com/clerk/javascript/issues/8302)
  on Next 16's proxy. Setting the var (as `.env.example` already does,
  pre-filled, not blank) fixes it — confirmed by re-running the same
  check with it set. Likely explanation: some implicit fallback
  Clerk's older middleware integration had no longer resolves inside
  Next 16's proxy execution context. Practical upshot: these vars were
  always documented as required: with `.env.example` copied as-is,
  nothing breaks — but don't test this app's auth redirect behavior
  with an abbreviated env var set that skips them, the way an early
  pass at this exact check did.

## Consequence for new code

Because middleware doesn't enforce this, **a new API route that forgets to
call `auth()` is silently unauthenticated** — there's no fallback net. See
[authorization.md](authorization.md) for the related (and historically
more dangerous) failure mode: calling `auth()` correctly but not checking
resource ownership correctly.

## Known gaps

- No organization/team concept — see [multi-tenancy.md](multi-tenancy.md).
- No API key mechanism for server-to-server access (planned v0.4).
