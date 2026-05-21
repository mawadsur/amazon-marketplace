# Marketplace MVP (US ↔ India)

Two-sided marketplace connecting US buyers with vetted Indian shops. AI-assisted seller
onboarding, AI-generated product listings, intent-aware search, dynamic trust scoring,
landed-cost transparency at checkout. Built end-to-end with stubs so the full flow is
demoable without external API keys.

## Status

| Module | Status |
|---|---|
| Seller onboarding (phone OTP, GST/PAN/Udyam, Razorpay bank linking) | ✅ |
| AI product generation (upload → BG removal → description → pricing → categorization) | ✅ |
| Buyer side (browse, search, cart, wishlist, reviews) | ✅ |
| Transaction layer (Stripe + Razorpay + escrow + payouts) | ✅ |
| Logistics (Shiprocket stub, customs docs, two-party tracking) | ✅ |
| Trust & safety (disputes, return policy, fraud signals, Buyer Protection) | ✅ |
| Admin dashboard (approvals, moderation, analytics, audit log) | ✅ |
| **Cathedral expansions (D2-D6, D8, D3v1)** | ✅ |
| **P1 critical fixes (OTP lockout, rate limits, webhook sigs, refund DLQ)** | ✅ |
| **Foundation hardening (Sentry, baseline tests, deploy config)** | ✅ |

## Local setup

```bash
cp .env.example .env             # defaults work for docker-compose Postgres+Redis
docker compose up -d             # Postgres 16 + Redis 7
npm install
npm run db:push                  # apply schema
npm run db:seed                  # 6 shops × ~5 products
npm run dev                      # http://localhost:3000
npm run dev:worker               # in a second terminal (BullMQ jobs + refunds)
```

OTP code in dev is **`123456`**. KYC auto-passes. Stripe/Razorpay/Shiprocket return
deterministic stub IDs. Claude is used when `ANTHROPIC_API_KEY` is set, otherwise
listing generation + concierge search + smart pricing fall back to deterministic
heuristics.

## Demo paths

- **Seller:** `/sell` → phone signup (`123456`) → wizard (profile / KYC / bank) → `/seller/products/new` → upload → AI processing → `/seller/products/[id]` → market-aware price recommendation → Publish
- **Admin:** `npm run promote:admin you@example.com`, sign in, `/admin/sellers` → Approve (auto-triggers Trust Score recompute + Provenance Story script generation)
- **Buyer:** `/shop` → search (e.g. "silk saree from Tamil Nadu under $100" → AI Concierge chips) → product → add to cart → `/checkout` (landed cost breakdown with duty + service) → Pay (stub) → `/buyer/orders/[id]` → `/buyer/orders/[id]/tracking`
- **Seller fulfillment:** `/seller/orders/[id]` → Mark shipped → `/seller/orders/[id]/shipment` → Advance status × 5 → on DELIVERED, payouts auto-mark PAID

## Tests

```bash
npm test                         # vitest run — 38 tests across pure libs
npm run test:watch
npm run test:coverage
```

## Deploy

Production targets: **Vercel** (web) + **Fly.io** (worker) + **Neon** (Postgres) + **Upstash** (Redis).

### 1. Database (Neon)

Create a Postgres project at https://neon.tech. Copy the pooled connection string. In production set:

```
DATABASE_URL="postgres://...?sslmode=require&pgbouncer=true&connect_timeout=15"
DIRECT_URL="postgres://...?sslmode=require"   # (optional, for prisma migrate deploy)
```

Run migrations once: `npx prisma migrate deploy`.

### 2. Redis (Upstash)

Create a Redis instance at https://upstash.com (free tier is enough for MVP). Copy the
TLS connection URL:

```
REDIS_URL="rediss://default:<token>@<host>:<port>"
```

### 3. Web (Vercel)

```bash
vercel link
vercel env add DATABASE_URL production   # paste Neon URL
vercel env add REDIS_URL production      # paste Upstash URL
# ... + AUTH_SECRET, ANTHROPIC_API_KEY, STRIPE_*, RAZORPAY_*, SHIPROCKET_*, S3_*, SENTRY_*
vercel deploy --prod
```

`vercel.json` sets security headers (X-Frame-Options, Referrer-Policy, etc.) and pins to the `iad1` region near Neon's default region.

### 4. Worker (Fly.io)

```bash
fly launch --name marketplace-worker --no-deploy   # answers: no Postgres, no Redis (we use Neon + Upstash)
fly secrets set DATABASE_URL=... REDIS_URL=... ANTHROPIC_API_KEY=... SENTRY_DSN=...
fly deploy
```

The worker image is built from the included `Dockerfile`. No HTTP port is exposed — it
only consumes BullMQ jobs over Redis. Fly will auto-restart on crash.

### 5. Sentry (optional but recommended)

Create a project at https://sentry.io. Set:

```
SENTRY_DSN=https://...@...sentry.io/...     # web + worker
NEXT_PUBLIC_SENTRY_DSN=                     # same, exposed to the browser
SENTRY_ORG=your-org
SENTRY_PROJECT=marketplace
SENTRY_AUTH_TOKEN=...                       # build-time, for source-map upload
```

With no DSN set, Sentry is a no-op — local dev is unaffected.

## Architecture

- `src/app/` — Next.js App Router routes (pages + API + server actions)
- `src/lib/` — shared infrastructure (db, env, storage, queue, ratelimit, customs, pricing, trust-score, concierge, story-video, …)
- `src/workers/ai.ts` — BullMQ worker entrypoint (6 queues: AI pipeline + payments refund + story video)
- `prisma/schema.prisma` — full data model (27 models, all enums)
- `vitest.config.ts` + `src/lib/__tests__/` — unit tests for the pure libs
- `vercel.json` + `Dockerfile` + `fly.toml` — production deploy config
- `.claude/`, `.claude-flow/` — ruflo runtime (development orchestration; not deployed)

## CEO plan + roadmap

- `~/.gstack/projects/amazon/ceo-plans/2026-05-21-marketplace-cathedral-expansion.md` — accepted cathedral expansions + sequencing
- `TODOS.md` — full P0/P1/P2/P3 backlog + accepted/deferred items
