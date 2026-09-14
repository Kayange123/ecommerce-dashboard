# Contributing

Thanks for considering contributing. This doc should be enough to get a
change from idea to merged PR without needing to ask a maintainer how to
start.

## Prerequisites

- Node.js 20+
- Docker (for local MongoDB)
- Free accounts with [Clerk](https://clerk.com), [Stripe](https://stripe.com)
  (test mode), and [Cloudinary](https://cloudinary.com) — see
  [docs/audits/current-state.md](docs/audits/current-state.md) for why none
  of these three have a local offline fallback yet (that's a legitimate
  thing to fix — see [good first issues](docs/contributing/good-first-issues.md)).

## Setup

Follow the [Quick start](README.md#quick-start) in the README. If anything
there doesn't work, that's a documentation bug — please open an issue.

## Making a change

1. **Open an issue first** for anything beyond a trivial fix (typo, small
   copy change). For a bug, describe the repro. For a feature, describe the
   use case before the implementation — see
   [docs/rfcs/README.md](docs/rfcs/README.md) if it's a design-level change.
2. **Branch naming**: `type/short-description`, e.g. `fix/product-idor`,
   `feat/inventory-model`, `docs/env-vars`.
3. **Commits**: no strict convention enforced yet, but a commit message
   should explain _why_, not just restate the diff.
4. **Write tests for behavior you add or fix.** See
   [Testing expectations](#testing-expectations) below — this is not
   optional for anything touching authorization, payments, or data
   mutation.
5. Run the full local check before opening a PR:

   ```bash
   npm run format:check
   npm run typecheck
   npm run lint
   npm run test
   npm run build
   ```

## Pull request requirements

- CI must pass (`.github/workflows/ci.yml` runs the same checks as above).
- Describe _what_ changed and _why_, and call out anything a reviewer
  should specifically look at (a tricky authorization boundary, a schema
  change, a behavior change).
- If your change touches `prisma/schema.prisma`, say so explicitly and
  explain the migration path — see [Database migrations](#database-migrations).
- Small, focused PRs review faster than large ones. If a change grew into
  several unrelated things, consider splitting it.

## Testing expectations

- **Anything that checks "does this user own this resource" needs a test
  proving the negative case** — that a _different_ store's data is not
  reachable. See `tests/integration/*-authorization.test.ts` for the
  pattern: an in-memory fake Prisma delegate
  (`tests/helpers/fakePrisma.ts`) that does real `where`-clause filtering,
  so the test fails against broken authorization code and passes against
  correct code.
- Unit tests: `tests/unit/`. Integration tests (route handlers +
  fake/mocked Prisma): `tests/integration/`. End-to-end (Playwright,
  against a running app): `tests/e2e/`.
- `npm run test:watch` while iterating; `npm run test` before pushing.

## Database migrations

MongoDB via Prisma has no `prisma migrate` — schema changes are applied
with `prisma db push` (`npm run db:migrate`). This means:

- There's no migration history file to review in a PR; the reviewer needs
  the _reasoning_ for a schema change in the PR description instead.
- Renaming or removing a field is effectively instant and lossy once
  pushed — call out any such change explicitly and, where the data
  matters, propose a backfill step rather than a bare rename.

## Adding an integration (payment provider, storage provider, etc.)

There's no formal provider interface yet (that's [ROADMAP.md](ROADMAP.md)
v0.4). Until it exists, a new integration should still be written as if
one will exist soon: isolate provider-specific code (SDK calls, webhook
parsing) behind a small module rather than spreading `stripe.*` or
`cloudinary.*` calls through route handlers and components, so it's a
mechanical move once the interface lands.

## Reporting bugs

Open a GitHub issue with: what you did, what you expected, what happened,
and repro steps. For a security vulnerability, see
[SECURITY.md](SECURITY.md) instead — do not open a public issue.

## Architecture principles

See [ARCHITECTURE.md](ARCHITECTURE.md). The short version: modular
monolith, not microservices; centralize authorization logic rather than
re-deriving it per route (this repo is actively migrating away from the
latter — see the audit); don't add an abstraction (a provider interface, a
domain module) before there's a second concrete case that needs it.
