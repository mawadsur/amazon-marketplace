import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { KycForm } from "@/components/seller/kyc-form";
import { OnboardingProgress } from "@/components/seller/onboarding-progress";

export const dynamic = "force-dynamic";

export default async function KycStepPage() {
  const user = await requireUser();
  const shop = await prisma.shop.findUnique({
    where: { ownerId: user.id },
    include: { kyc: true },
  });

  if (!shop) redirect("/seller/onboarding/profile");

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <OnboardingProgress current="kyc" />
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Verify your business</h1>
        <p className="text-sm text-muted-foreground">
          Provide at least one ID. We&apos;ll verify it instantly — your data is never shown to buyers.
        </p>
      </header>
      <KycForm
        defaults={{
          gstNumber: shop.kyc?.gstNumber ?? "",
          panNumber: shop.kyc?.panNumber ?? "",
          udyamNumber: shop.kyc?.udyamNumber ?? "",
        }}
      />
    </div>
  );
}
