// Buyer self-registration (email + password). Creates a BUYER User plus a
// "credentials" Account whose access_token holds the bcrypt hash — exactly the
// shape the NextAuth `email-password` provider reads in src/lib/auth.ts.
//
// Sellers use phone-OTP (see /api/otp/send); this endpoint is buyer-only.

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { rateLimit, clientKey, rateLimitHeaders } from "@/lib/ratelimit";
import { registerSchema } from "@/lib/auth-register-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const limit = await rateLimit(clientKey(req, "auth.register"), 5, 60);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a moment." },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid email and a password of at least 8 characters." },
      { status: 400 },
    );
  }
  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json(
      { error: "EMAIL_TAKEN", message: "An account with that email already exists." },
      { status: 409 },
    );
  }

  const hash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      email: normalizedEmail,
      name: name || null,
      role: "BUYER",
      accounts: {
        create: {
          type: "credentials",
          provider: "credentials",
          providerAccountId: normalizedEmail,
          access_token: hash,
        },
      },
    },
  });

  return NextResponse.json({ ok: true });
}
