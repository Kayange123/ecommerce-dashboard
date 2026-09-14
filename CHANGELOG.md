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

## [0.1.0] — prior history

Everything before this changelog existed: the original ecommerce admin
dashboard (Next.js 13, Clerk, Prisma/MongoDB, Stripe, Cloudinary) — see
`git log` for the detailed history.
