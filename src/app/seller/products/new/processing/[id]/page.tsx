import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProcessingStatus } from "@/components/listing/processing-status";

export const dynamic = "force-dynamic";

export default async function ProcessingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  if (session.user.role !== "SELLER") redirect("/");

  const { id } = await params;
  const product = await prisma.product.findFirst({
    where: { id, shop: { ownerId: session.user.id } },
    select: { id: true },
  });
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-2xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Generating your listing</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            We&apos;re cleaning up your photo and drafting the listing. This usually takes a few seconds.
          </p>
          <ProcessingStatus productId={product.id} />
        </CardContent>
      </Card>
    </div>
  );
}
