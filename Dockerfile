# Production build image for the dashboard. Local development does not use
# this image — run `docker compose up -d` for the database, then `npm run
# dev` on the host. This Dockerfile is for deploying the built app.

FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma

FROM base AS deps
RUN npm ci

FROM deps AS build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm ci --omit=dev
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
RUN chown -R node:node /app

USER node
EXPOSE 3000
CMD ["npm", "run", "start"]
