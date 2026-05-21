import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function SellerDashboardPage() {
  const user = await requireUser();
  const shop = await prisma.shop.findUnique({
    where: { ownerId: user.id },
    include: { kyc: true, bank: true },
  });

  const kycVerified = shop?.kyc?.status === "VERIFIED";
  const bankLinked = Boolean(shop?.bank?.verified);

  // Funnel sellers who haven't finished setup into the wizard.
  if (!shop || !kycVerified || !bankLinked) {
    redirect("/seller/onboarding");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">Welcome back</p>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{shop.name}</h1>
        <p className="text-sm text-muted-foreground">
          Status: <StatusBadge status={shop.status} />
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard title="KYC" value={shop.kyc?.status ?? "NOT_SUBMITTED"} />
        <StatCard title="Bank" value={bankLinked ? "Linked" : "Not linked"} />
        <StatCard title="Products" value="0" hint="Add your first listing" />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add your first product</CardTitle>
            <CardDescription>Use AI to draft a listing from a few photos and a sentence.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/seller/products/new">Start listing</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What happens next</CardTitle>
            <CardDescription>
              Our team reviews new shops within 24h. You can list products in the meantime —
              they&apos;ll go live once your shop is approved.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "APPROVED"
      ? "bg-emerald-100 text-emerald-800"
      : status === "PENDING_REVIEW"
        ? "bg-amber-100 text-amber-800"
        : "bg-rose-100 text-rose-800";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function StatCard({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl">{value.replace(/_/g, " ")}</CardTitle>
      </CardHeader>
      {hint && (
        <CardContent>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </CardContent>
      )}
    </Card>
  );
}
