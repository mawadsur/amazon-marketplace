import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewProductForm } from "@/components/listing/new-product-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  if (session.user.role !== "SELLER") redirect("/");

  const shop = await prisma.shop.findUnique({
    where: { ownerId: session.user.id },
    select: { id: true },
  });
  if (!shop) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <p className="text-muted-foreground">
          Finish setting up your shop first.{" "}
          <Link className="underline" href="/seller/onboarding">
            Continue onboarding →
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <Link
          href="/seller/products"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Back to products
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>New product</CardTitle>
        </CardHeader>
        <CardContent>
          <NewProductForm />
        </CardContent>
      </Card>
    </div>
  );
}
