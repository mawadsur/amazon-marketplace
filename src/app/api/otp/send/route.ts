import { NextResponse } from "next/server";
import { z } from "zod";
import { sendOtp } from "@/lib/stubs";

const bodySchema = z.object({
  phone: z
    .string()
    .trim()
    // Permissive E.164-ish: digits + optional leading "+", 8-20 chars total.
    .regex(/^\+?\d{8,19}$/, "Enter a valid phone number with country code"),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const result = await sendOtp(parsed.data.phone);
  return NextResponse.json(result);
}
