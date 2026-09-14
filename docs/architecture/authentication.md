# Authentication

[Clerk](https://clerk.com) (`@clerk/nextjs`) handles sign-up, sign-in, and
session management.

## How it's wired in

- `middleware.ts` uses Clerk's `authMiddleware` (v4 API — scheduled for
  migration to `clerkMiddleware` alongside the Clerk v6 upgrade, see
  [ROADMAP.md](../../ROADMAP.md) v0.2) and marks `/api/:path*` as a
  **public route** for Clerk's own purposes.
- This means Clerk itself performs **no enforcement** on API routes. Every
  route handler under `app/api/` calls `auth()` directly and checks
  `userId` itself. This is a deliberate, if easy-to-misread, pattern: it's
  not that these routes are unauthenticated, it's that authentication is
  checked in application code rather than in middleware.
- Dashboard pages (`app/(dashboard)/[storeId]/layout.tsx`) check `auth()`
  server-side and `redirect('/sign-in')` if there's no `userId`.

## Consequence for new code

Because middleware doesn't enforce this, **a new API route that forgets to
call `auth()` is silently unauthenticated** — there's no fallback net. See
[authorization.md](authorization.md) for the related (and historically
more dangerous) failure mode: calling `auth()` correctly but not checking
resource ownership correctly.

## Known gaps

- No organization/team concept — see [multi-tenancy.md](multi-tenancy.md).
- No API key mechanism for server-to-server access (planned v0.4).
