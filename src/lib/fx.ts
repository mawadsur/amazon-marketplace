// Pure FX helpers — NO server imports (no env, no prisma, no SDKs), so currency
// formatting in client components never drags server-only code into the browser
// bundle. The static rate is a stub; swap for a live FX provider later.

export const FX_USD_TO_INR = 83.5;

export function usdCentsToInrPaise(usdCents: number): number {
  return Math.round(usdCents * FX_USD_TO_INR);
}

export function inrPaiseToUsdCents(inrPaise: number): number {
  return Math.round(inrPaise / FX_USD_TO_INR);
}
