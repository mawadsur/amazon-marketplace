// Next.js 15 instrumentation entry. Sentry init runs here so the SDK is
// loaded before any request handler. Both branches are no-ops when SENTRY_DSN
// is unset (which is the case in dev unless explicitly opted in).

export async function register() {
  if (!process.env.SENTRY_DSN) return;
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

// Captures server-side rendering / API route errors and reports to Sentry.
export async function onRequestError(
  err: unknown,
  request: Parameters<
    typeof import("@sentry/nextjs").captureRequestError
  >[1],
  context: Parameters<typeof import("@sentry/nextjs").captureRequestError>[2],
): Promise<void> {
  if (!process.env.SENTRY_DSN) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(err, request, context);
}
