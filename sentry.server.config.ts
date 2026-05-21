// Sentry server-side init (Node runtime). Loaded by src/instrumentation.ts
// when SENTRY_DSN is set. No-op otherwise.

import * as Sentry from "@sentry/nextjs";

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    // Don't capture noise from health checks etc.
    ignoreErrors: ["UNAUTHENTICATED", "FORBIDDEN", "RATE_LIMITED"],
  });
}
