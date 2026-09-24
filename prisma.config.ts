// A prisma.config.ts file's mere presence disables Prisma's own
// automatic .env loading — confirmed empirically: without this explicit
// load, `prisma db push` failed with "Environment variable not found:
// DATABASE_URL" against a real .env file that worked fine before this
// config file existed. Must be imported before defineConfig runs.
import "dotenv/config";
import { defineConfig } from "prisma/config";

// Replaces the deprecated `package.json#prisma` field (Prisma 6 warns it
// will be removed in Prisma 7). Datasource/provider stay in
// prisma/schema.prisma — this app isn't adopting Prisma's config-driven
// MongoDB setup (that's an 8.x-only, ground-up rewrite of the query API;
// see docs/rfcs/RFC-002-prisma-8-mongodb-migration.md).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
