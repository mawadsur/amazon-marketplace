# Dockerfile for the BullMQ worker process (NOT the Next.js web app).
# The web app deploys to Vercel; this image runs separately on Fly.io
# (or any container host) and connects to the same Postgres + Redis.
#
# Build:  docker build -t marketplace-worker .
# Run:    docker run --rm --env-file .env marketplace-worker

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# --- deps ----------------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
# Include devDeps so tsx + prisma CLI are available at runtime.
RUN npm ci --include=dev --no-audit --no-fund
# Generate Prisma client against the schema baked into the image.
RUN npx prisma generate

# --- runtime -------------------------------------------------------------
FROM base AS runtime
ENV NODE_ENV=production
ENV NODE_OPTIONS="--enable-source-maps"

# Non-root user.
RUN addgroup --system --gid 1001 worker \
  && adduser --system --uid 1001 worker

COPY --from=deps --chown=worker:worker /app/node_modules ./node_modules
COPY --chown=worker:worker package.json package-lock.json ./
COPY --chown=worker:worker prisma ./prisma
COPY --chown=worker:worker tsconfig.json ./
COPY --chown=worker:worker src ./src

USER worker

# Worker process — long-running, no HTTP port exposed.
CMD ["node", "--import", "tsx/esm", "src/workers/ai.ts"]
