// Dev stubs for external services. Agents should import these and route
// calls through them; swap real SDK calls in when keys are configured.
//
// Convention: every stub is a Promise-returning function whose shape matches
// what the real integration would return, so swapping later is a 1-file edit.

import { env } from "@/lib/env";
import { generateText } from "@/lib/ai";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

// ---------------------------------------------------------------- OTP (Module 1)

const STUB_OTP = "123456";

export async function sendOtp(phone: string): Promise<{ sent: true; devCode?: string }> {
  const code = env.TWILIO_VERIFY_SERVICE_SID
    ? // Real-mode placeholder: when Twilio creds exist, the real call goes here.
      // For now we still write the OTP row so the auth flow works in dev.
      Math.floor(100000 + Math.random() * 900000).toString()
    : STUB_OTP;

  const hash = await bcrypt.hash(code, 10);
  await prisma.otpCode.create({
    data: {
      phone,
      codeHash: hash,
      expiresAt: new Date(Date.now() + 10 * 60_000),
    },
  });

  // In stub mode, expose the code so dev UI can show it. NEVER do this in prod.
  return env.TWILIO_VERIFY_SERVICE_SID ? { sent: true } : { sent: true, devCode: code };
}

// ---------------------------------------------------------------- KYC (Module 1)

export async function verifyKyc(inp: {
  gstNumber?: string;
  panNumber?: string;
  udyamNumber?: string;
}): Promise<{ verified: boolean; reason?: string }> {
  // Stub: any non-empty value passes. Real provider integration goes here.
  if (!inp.gstNumber && !inp.panNumber && !inp.udyamNumber) {
    return { verified: false, reason: "Provide at least one of GST / PAN / Udyam." };
  }
  return { verified: true };
}

// ---------------------------------------------------------------- Razorpay payouts (Module 1/4)

export async function razorpayCreateFundAccount(inp: {
  name: string;
  accountNumber: string;
  ifsc: string;
}): Promise<{ contactId: string; fundAccountId: string }> {
  // Stub returns deterministic IDs derived from input.
  const suffix = Buffer.from(inp.accountNumber).toString("hex").slice(0, 12);
  return { contactId: `cont_stub_${suffix}`, fundAccountId: `fa_stub_${suffix}` };
}

export async function razorpayCreatePayout(inp: {
  fundAccountId: string;
  amountInrPaise: number;
  reference: string;
}): Promise<{ payoutId: string; status: "processing" }> {
  return { payoutId: `pout_stub_${inp.reference}`, status: "processing" };
}

// ---------------------------------------------------------------- Stripe (Module 4)

export async function stripeCreateCheckout(inp: {
  orderId: string;
  amountUsdCents: number;
}): Promise<{ url: string; intentId: string }> {
  return {
    url: `/checkout/stub/${inp.orderId}`,
    intentId: `pi_stub_${inp.orderId}`,
  };
}

export async function stripeRefund(inp: {
  chargeId?: string | null;
  intentId?: string | null;
  amountUsdCents: number;
  reason?: string;
}): Promise<{ refundId: string; status: "succeeded" }> {
  const tail = (inp.chargeId ?? inp.intentId ?? "unknown").slice(-12);
  return { refundId: `re_stub_${tail}`, status: "succeeded" };
}

// ---------------------------------------------------------------- Shiprocket (Module 5)

export async function shiprocketCreateShipment(inp: {
  orderId: string;
  weightGrams: number;
  destinationCountry: string;
}): Promise<{
  trackingNumber: string;
  labelUrl: string;
  customsDocUrl: string;
  estimatedDelivery: Date;
}> {
  const eta = new Date(Date.now() + 9 * 24 * 60 * 60_000);
  return {
    trackingNumber: `SR${inp.orderId.toUpperCase()}`,
    labelUrl: `/stub/labels/${inp.orderId}.pdf`,
    customsDocUrl: `/stub/customs/${inp.orderId}.pdf`,
    estimatedDelivery: eta,
  };
}

// ---------------------------------------------------------------- Background removal (Module 2)

export async function removeBackground(imageUrl: string): Promise<{ outputUrl: string }> {
  // Stub: returns the same URL with a marker. Real call would POST to remove.bg.
  return { outputUrl: imageUrl + "#bg-removed-stub" };
}

// ---------------------------------------------------------------- Claude-backed AI helpers (Module 2/3)

export async function aiGenerateDescription(inp: {
  sourceText: string;
  sourceLang: string;
  shopName: string;
  category: string;
}): Promise<{ title: string; description: string; tags: string[] }> {
  if (!env.ANTHROPIC_API_KEY) {
    return {
      title: `${inp.category} from ${inp.shopName}`,
      description:
        inp.sourceText ||
        `Authentic ${inp.category} from ${inp.shopName}. Handcrafted with care.`,
      tags: [inp.category, "handmade", "india"],
    };
  }
  const sys = `You write US-English product listings for a marketplace of authentic Indian goods. Translate from the source language. Output JSON: {"title": string (<= 70 chars), "description": string (120-220 words, friendly, no superlatives, mention craft and provenance), "tags": string[] (3-6 lowercase, no spaces)}.`;
  const prompt = `Shop: ${inp.shopName}\nCategory: ${inp.category}\nSource (${inp.sourceLang}): ${inp.sourceText}\n\nReturn only the JSON.`;
  const { text } = await generateText({ system: sys, prompt, maxTokens: 800 });
  try {
    const parsed = JSON.parse(text);
    return {
      title: String(parsed.title),
      description: String(parsed.description),
      tags: Array.isArray(parsed.tags) ? parsed.tags.map(String) : [],
    };
  } catch {
    return { title: inp.sourceText.slice(0, 70), description: inp.sourceText, tags: [inp.category] };
  }
}

export async function aiSuggestPrice(inp: {
  category: string;
  attributes?: Record<string, unknown>;
}): Promise<{ priceUsdCents: number; rationale: string }> {
  const benchmarks: Record<string, number> = {
    handicrafts: 4500,
    textiles: 6800,
    jewelry: 8900,
  };
  const cents = benchmarks[inp.category.toLowerCase()] ?? 5000;
  return { priceUsdCents: cents, rationale: `Stub benchmark for ${inp.category}.` };
}

export async function aiCategorize(inp: {
  title: string;
  description: string;
}): Promise<{ category: string; tags: string[] }> {
  const t = (inp.title + " " + inp.description).toLowerCase();
  const category = t.includes("saree") || t.includes("textile") || t.includes("fabric")
    ? "textiles"
    : t.includes("ring") || t.includes("necklace") || t.includes("earring") || t.includes("jewelry")
      ? "jewelry"
      : "handicrafts";
  return { category, tags: [category] };
}

// ---------------------------------------------------------------- FX (Module 4)

// Static stub FX rate; replace with a live FX provider later.
export const FX_USD_TO_INR = 83.5;

export function usdCentsToInrPaise(usdCents: number) {
  return Math.round(usdCents * FX_USD_TO_INR);
}
export function inrPaiseToUsdCents(inrPaise: number) {
  return Math.round(inrPaise / FX_USD_TO_INR);
}
