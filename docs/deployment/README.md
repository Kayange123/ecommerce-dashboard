# Deployment

## Requirements

- A reachable MongoDB deployment configured as a replica set (Atlas
  satisfies this automatically; a self-hosted deployment needs `--replSet`
  — see [docs/architecture/multi-tenancy.md](../architecture/multi-tenancy.md)).
- Production Clerk, Stripe, and Cloudinary credentials (test-mode keys
  won't process real payments or send real emails).
- `STRIPE_WEB_HOOK_SECRET` matching a webhook endpoint configured in the
  Stripe dashboard to point at `https://<your-domain>/api/webhook`.

## Option A: Node runtime

```bash
npm ci
npm run build
npm run start
```

Set environment variables per [.env.example](../../.env.example) in your
hosting platform's config, not in a committed file.

## Option B: Container

```bash
docker build --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_real_key -t ecommerce-dashboard .
docker run -p 3000:3000 --env-file .env ecommerce-dashboard
```

**`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` must be passed with `--build-arg`,
not just in the `.env` file used at `docker run` time.** Next.js inlines
every `NEXT_PUBLIC_*` variable into the client JavaScript bundle at
_build_ time — setting it only at `docker run` has no effect, since the
bundle was already produced with whatever value (or the Dockerfile's
placeholder default) was present during `docker build`. This is standard
Next.js-in-Docker behavior, not specific to this app, but easy to get
bitten by: if the deployed site is calling Clerk with the wrong
publishable key, this is almost always why. `CLERK_SECRET_KEY` doesn't
have this problem — it's read server-side at runtime, so `--env-file`/
`docker run -e` at container start works normally for it.

The provided [Dockerfile](../../Dockerfile) is a multi-stage production
build; it does not run `prisma db push` on start — apply schema changes
against your production database explicitly (`npm run db:migrate`) as a
separate, deliberate step, not automatically on container boot.

## What isn't handled yet

- Zero-downtime schema changes — `prisma db push` applies immediately;
  there's no migration-review step (see the CONTRIBUTING.md note on
  database migrations).
- Horizontal scaling considerations for the Stripe webhook (no dedupe —
  see [docs/architecture/payments.md](../architecture/payments.md)) if you
  run more than one instance.
- Structured observability/monitoring hooks (planned, see
  [ROADMAP.md](../../ROADMAP.md); not blocking a first deploy).
