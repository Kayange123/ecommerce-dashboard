# Getting Started

This expands on the README's [Quick start](../../README.md#quick-start)
with the "why" behind each step.

## 1. Clone and install

```bash
git clone https://github.com/Kayange123/ecommerce-dashboard.git
cd ecommerce-dashboard
npm install
```

`postinstall` runs `prisma generate`, which reads `prisma/schema.prisma`
and generates the typed Prisma Client — this doesn't need a live database
connection, just the schema file.

## 2. Start local MongoDB

```bash
docker compose up -d
```

This starts MongoDB **as a single-node replica set**, not a plain
`mongod`. Prisma requires a replica set to support transactions and nested
writes, even locally — see
[docs/architecture/multi-tenancy.md](../architecture/multi-tenancy.md) for
why this matters and what breaks without it.

## 3. Configure environment variables

```bash
cp .env.example .env
```

Every variable is documented inline in `.env.example`. Three integrations
have no local/offline fallback and need a real (free-tier) account:

- **Clerk** — authentication. https://dashboard.clerk.com
- **Stripe** — checkout + webhook, use test-mode keys. https://dashboard.stripe.com/test/apikeys
- **Cloudinary** — image uploads. https://cloudinary.com

`DATABASE_URL` is already pre-filled for the Docker Compose setup above; if
you're pointing at MongoDB Atlas instead, replace it with your Atlas
connection string.

## 4. Apply the schema and start the app

```bash
npm run db:migrate   # prisma db push
npm run dev
```

Open http://localhost:3000, sign up, and create your first store from the
UI — the store-creation modal appears automatically for a signed-in user
with no stores yet.

## 5. Seed demo data (optional but recommended)

Stores are owned by a single Clerk user id, so seeded data needs to know
_which_ account to attach to:

1. Sign in once (step 4).
2. Copy your Clerk user id from the [Clerk dashboard](https://dashboard.clerk.com)
   → Users, or from your own account's settings.
3. Set `SEED_CLERK_USER_ID` in `.env`.
4. Run:

   ```bash
   npm run db:seed
   ```

This creates two demo stores ("Demo: Apparel Co" and "Demo: Home &
Living"), each with billboards, categories, sizes, ~20 products, and a mix
of paid/unpaid orders. Run `npm run db:reset` to wipe and recreate it.

## Next steps

- [ARCHITECTURE.md](../../ARCHITECTURE.md) for how the pieces fit together.
- [CONTRIBUTING.md](../../CONTRIBUTING.md) for how to make a change.
- [docs/audits/current-state.md](../audits/current-state.md) for known gaps.
