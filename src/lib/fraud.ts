// Fraud signal recording + cheap heuristic checks.
//
// We never block on signals here — we emit FraudSignal rows that admins can
// review out-of-band. A higher-level moderation engine can subscribe later.

import { prisma } from "@/lib/db";
import type { FraudSignal, Prisma } from "@prisma/client";

export type SignalKind =
  | "duplicate_gst"
  | "duplicate_pan"
  | "ip_velocity"
  | "missing_phone"
  | "missing_email"
  | "suspicious_signup"
  | "ip_blocklist";

export type SignalInput = {
  userId?: string | null;
  kind: SignalKind | string;
  /** 1..10; higher = more suspicious. */
  severity: number;
  context?: Prisma.InputJsonValue;
};

/** Write one signal. Caller decides severity; we just persist. */
export async function recordSignal(input: SignalInput): Promise<FraudSignal> {
  const severity = Math.max(1, Math.min(10, Math.round(input.severity)));
  return prisma.fraudSignal.create({
    data: {
      userId: input.userId ?? null,
      kind: input.kind,
      severity,
      context: input.context,
    },
  });
}

/** Recent signals for a user, newest first. Used by admin surfaces. */
export async function recentSignalsForUser(
  userId: string,
  limit = 25,
): Promise<FraudSignal[]> {
  return prisma.fraudSignal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Returns the userIds of *other* shop owners who already submitted the same
 * GST number. If `userIdToExclude` is provided it's left out of the result.
 * Empty list = unique. Empty/blank GST is always treated as unique.
 */
export async function flagDuplicateGst(
  gst: string | null | undefined,
  userIdToExclude?: string | null,
): Promise<string[]> {
  if (!gst || !gst.trim()) return [];
  const normalized = gst.trim().toUpperCase();

  const matches = await prisma.shopKyc.findMany({
    where: { gstNumber: normalized },
    select: { shop: { select: { ownerId: true } } },
  });

  const ownerIds = matches
    .map((m) => m.shop.ownerId)
    .filter((id): id is string => Boolean(id));

  if (!userIdToExclude) return ownerIds;
  return ownerIds.filter((id) => id !== userIdToExclude);
}

export type SignupContext = {
  ip?: string | null;
  userAgent?: string | null;
};

export type SignupUserSnapshot = {
  id: string;
  email?: string | null;
  phone?: string | null;
};

export type SignupShopSnapshot = {
  id: string;
  gstNumber?: string | null;
  panNumber?: string | null;
};

/**
 * Run cheap heuristics at the end of seller signup. Emits zero or more
 * FraudSignal rows. Never throws on individual check failure — fraud checks
 * are best-effort.
 *
 * Returns the list of signals that were emitted, so the caller can decide to
 * surface them in the admin queue or auto-suspend if severity ≥ N.
 */
export async function runSignupChecks(
  user: SignupUserSnapshot,
  shop?: SignupShopSnapshot,
  ctx?: SignupContext,
): Promise<FraudSignal[]> {
  const emitted: FraudSignal[] = [];

  // 1) Missing contact channels.
  if (!user.phone) {
    try {
      emitted.push(
        await recordSignal({
          userId: user.id,
          kind: "missing_phone",
          severity: 2,
          context: { source: "signup" },
        }),
      );
    } catch {
      /* never block signup on a signal write */
    }
  }
  if (!user.email) {
    try {
      emitted.push(
        await recordSignal({
          userId: user.id,
          kind: "missing_email",
          severity: 1,
          context: { source: "signup" },
        }),
      );
    } catch {
      /* ignore */
    }
  }

  // 2) Duplicate GST across shops.
  if (shop?.gstNumber) {
    const others = await flagDuplicateGst(shop.gstNumber, user.id).catch(
      () => [] as string[],
    );
    if (others.length > 0) {
      try {
        emitted.push(
          await recordSignal({
            userId: user.id,
            kind: "duplicate_gst",
            severity: 7,
            context: { gst: shop.gstNumber, otherOwnerIds: others },
          }),
        );
      } catch {
        /* ignore */
      }
    }
  }

  // 3) IP velocity — many signups from the same IP recently.
  if (ctx?.ip) {
    const since = new Date(Date.now() - 60 * 60 * 1000); // 1 hour
    const count = await prisma.fraudSignal
      .count({
        where: {
          createdAt: { gte: since },
          kind: "suspicious_signup",
          context: { path: ["ip"], equals: ctx.ip },
        },
      })
      .catch(() => 0);
    if (count >= 3) {
      try {
        emitted.push(
          await recordSignal({
            userId: user.id,
            kind: "ip_velocity",
            severity: 6,
            context: { ip: ctx.ip, recentCount: count },
          }),
        );
      } catch {
        /* ignore */
      }
    }
    // Always log a low-severity beacon to power future velocity checks.
    try {
      emitted.push(
        await recordSignal({
          userId: user.id,
          kind: "suspicious_signup",
          severity: 1,
          context: { ip: ctx.ip, userAgent: ctx.userAgent ?? null },
        }),
      );
    } catch {
      /* ignore */
    }
  }

  return emitted;
}
