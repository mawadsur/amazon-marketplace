# Marketplace MVP (US ↔ India)

Two-sided marketplace connecting US buyers with vetted Indian shops, with AI-assisted
seller onboarding and product-listing generation.

## Status

**Foundation:** Next.js 15 + TS + Tailwind + Prisma scaffolded. Schema covers all 7 MVP
modules. No module logic implemented yet — tracked via Claude Code task list and the
ruflo swarm (`swarm-mpfbv07l`).

## Local setup

```bash
cp .env.example .env             # defaults work for the included docker-compose
docker compose up -d             # Postgres 16 + Redis 7
npm install
npm run db:push                  # create tables
npm run dev                      # http://localhost:3000
```

Dev stubs are wired so the full flow is demoable without any external API keys.
OTP code in dev is **`123456`**. KYC always passes. Stripe/Razorpay/Shiprocket return
deterministic fake IDs. Claude is used if `ANTHROPIC_API_KEY` is set, otherwise
descriptions fall back to a templated stub.

## Modules

| # | Module | Status |
|---|--------|--------|
| 1 | Seller onboarding | not started |
| 2 | AI product generation | not started |
| 3 | Buyer side | not started |
| 4 | Transaction layer (Stripe + Razorpay) | not started |
| 5 | Logistics (Shiprocket) | not started |
| 6 | Trust & safety | not started |
| 7 | Admin dashboard | not started |

## Architecture

- `src/app/` — Next.js App Router routes
- `src/lib/` — shared infrastructure (db, env, storage, queue)
- `prisma/schema.prisma` — full data model for all 7 modules
- `.claude/`, `.claude-flow/` — ruflo runtime (orchestration / agent coordination)
