import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { OnboardingProgress } from "@/components/seller/onboarding-progress";

export const dynamic = "force-dynamic";

export default async function OnboardingDonePage() {
  const user = await requireUser();
  const shop = await prisma.shop.findUnique({
    where: { ownerId: user.id },
    include: { kyc: true, bank: true },
  });

  if (!shop) redirect("/seller/onboarding/profile");
  if (shop.kyc?.status !== "VERIFIED") redirect("/seller/onboarding/kyc");
  if (!shop.bank?.verified) redirect("/seller/onboarding/bank");

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <OnboardingProgress current="done" />

      <div className="space-y-3 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-3xl">
          <span aria-hidden>✓</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">You&apos;re all set, {shop.name}</h1>
        <p className="text-sm text-muted-foreground">
          Your shop is now under review. Most shops are approved within 24 hours.
          You can start drafting product listings right away.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-5 text-sm">
        <p className="font-medium">What happens next</p>
        <ul className="mt-2 space-y-1 text-muted-foreground">
          <li>• Our team reviews your shop and KYC.</li>
          <li>• Once approved, your listings go live to US buyers.</li>
          <li>• Payouts settle to your linked bank account.</li>
        </ul>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button asChild size="lg" className="h-12 flex-1 text-base">
          <Link href="/seller/products/new">Add your first product</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="h-12 flex-1 text-base">
          <Link href="/seller">Go to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
