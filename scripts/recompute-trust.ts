// Recompute the trust score (and derived badge/tier) for every APPROVED shop.
//
//   npm run trust:recompute
//
// Event triggers (review / dispute / order capture) keep scores fresh during
// normal operation, but tenure crosses the 30/90-day thresholds with no event —
// run this on a daily cron so those (and any drift) get picked up.

import { prisma } from "../src/lib/db";
import { applyTrustScoreNow } from "../src/lib/trust-score";
import { tierForScore } from "../src/lib/tiers";

async function main() {
  const shops = await prisma.shop.findMany({
    where: { status: "APPROVED" },
    select: { id: true, name: true },
  });
  console.log(`Recomputing trust for ${shops.length} approved shop(s)…`);

  let ok = 0;
  for (const shop of shops) {
    try {
      const result = await applyTrustScoreNow(shop.id);
      ok += 1;
      console.log(
        `  ${shop.name}: score=${result.score} badge=${result.tier} tier=${tierForScore(result.score)}`,
      );
    } catch (err) {
      console.error(`  ${shop.name}: FAILED`, err);
    }
  }
  console.log(`Done. ${ok}/${shops.length} recomputed.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
