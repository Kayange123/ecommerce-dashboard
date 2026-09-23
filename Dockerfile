# Production build image for the dashboard. Local development does not use
# this image — run `docker compose up -d` for the database, then `npm run
# dev` on the host. This Dockerfile is for deploying the built app.

FROM node:25-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma

FROM base AS deps
RUN npm ci

FROM deps AS build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1

# @clerk/nextjs@6's ClerkProvider throws during page prerendering if no
# publishableKey is present — `npm run build` now fails without one,
# where the previous Clerk major didn't require this. Only the *public*
# key is needed at build time (confirmed: the build succeeds with no
# CLERK_SECRET_KEY set at all — that one is only read server-side at
# runtime, never baked into the client bundle, so it deliberately isn't
# an ARG here to avoid landing a secret in the image's build history).
# The placeholder default below lets `docker build` succeed out of the
# box (matching CI); NEXT_PUBLIC_* values are baked into the client
# bundle at BUILD time, not read at container start, so a real
# deployment must pass its real publishable key via `--build-arg`, not
# `docker run -e`. See docs/deployment/README.md.
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_ZmFrZS1rZXktZm9yLWJ1aWxkLnRlc3QuY2xlcmsuYWNjb3VudHMuZGV2JA
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}

RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# --ignore-scripts: `postinstall` runs `prisma generate`, but the `prisma`
# CLI is a devDependency, so it's unavailable under --omit=dev. The
# generated client is copied from the build stage below instead.
RUN npm ci --omit=dev --ignore-scripts
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
RUN chown -R node:node /app

USER node
EXPOSE 3000
CMD ["npm", "run", "start"]
