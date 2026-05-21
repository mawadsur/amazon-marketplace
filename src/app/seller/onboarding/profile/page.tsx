import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProfileForm } from "@/components/seller/profile-form";
import { OnboardingProgress } from "@/components/seller/onboarding-progress";

export const dynamic = "force-dynamic";

export default async function ProfileStepPage() {
  const user = await requireUser();
  const shop = await prisma.shop.findUnique({ where: { ownerId: user.id } });

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <OnboardingProgress current="profile" />
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Tell us about your shop</h1>
        <p className="text-sm text-muted-foreground">
          This is what buyers will see on your storefront. You can edit it later.
        </p>
      </header>

      <ProfileForm
        defaults={{
          name: shop?.name ?? "",
          city: shop?.city ?? "",
          region: shop?.region ?? "",
          category: (shop?.category as "handicrafts" | "textiles" | "jewelry" | undefined) ?? "handicrafts",
          languages: shop?.languages ?? ["en"],
          bio: shop?.bio ?? "",
        }}
      />
    </div>
  );
}
