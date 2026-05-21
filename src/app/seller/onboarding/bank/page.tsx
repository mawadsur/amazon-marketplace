import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { BankForm } from "@/components/seller/bank-form";
import { OnboardingProgress } from "@/components/seller/onboarding-progress";

export const dynamic = "force-dynamic";

export default async function BankStepPage() {
  const user = await requireUser();
  const shop = await prisma.shop.findUnique({
    where: { ownerId: user.id },
    include: { kyc: true, bank: true },
  });

  if (!shop) redirect("/seller/onboarding/profile");
  if (shop.kyc?.status !== "VERIFIED") redirect("/seller/onboarding/kyc");

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <OnboardingProgress current="bank" />
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Link your payout account</h1>
        <p className="text-sm text-muted-foreground">
          Payouts go to your Indian bank account in INR. We use Razorpay — your account
          details stay encrypted.
        </p>
      </header>
      <BankForm
        defaults={{
          accountHolderName: shop.bank?.accountHolderName ?? "",
          ifsc: shop.bank?.ifsc ?? "",
        }}
      />
    </div>
  );
}
