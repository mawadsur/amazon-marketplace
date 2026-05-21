import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function OnboardingEntryPage() {
  const user = await requireUser();
  const shop = await prisma.shop.findUnique({
    where: { ownerId: user.id },
    include: { kyc: true, bank: true },
  });

  if (!shop) redirect("/seller/onboarding/profile");
  if (shop.kyc?.status !== "VERIFIED") redirect("/seller/onboarding/kyc");
  if (!shop.bank?.verified) redirect("/seller/onboarding/bank");
  redirect("/seller/onboarding/done");
}
