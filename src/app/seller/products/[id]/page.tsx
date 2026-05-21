import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill } from "@/components/listing/status-pill";
import { DraftEditor } from "@/components/listing/draft-editor";

export const dynamic = "force-dynamic";

export default async function SellerProductPage({
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
    include: {
      images: { orderBy: { position: "asc" } },
      tags: true,
      category: true,
    },
  });
  if (!product) notFound();

  const isPublishable = !!product.title && product.priceUsdCents > 0;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/seller/products"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Back to products
        </Link>
        <StatusPill value={product.status} />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Photos</CardTitle>
        </CardHeader>
        <CardContent>
          {product.images.length === 0 ? (
            <p className="text-sm text-muted-foreground">No images yet.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {product.images.map((img) => (
                <div key={img.id} className="space-y-1">
                  <div className="h-28 w-28 overflow-hidden rounded-md border bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.kind}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="text-center text-xs text-muted-foreground">
                    {img.kind.toLowerCase().replace(/_/g, " ")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Edit listing</CardTitle>
          {product.category ? (
            <p className="text-xs text-muted-foreground">
              Category: {product.category.name}
            </p>
          ) : null}
        </CardHeader>
        <CardContent>
          <DraftEditor
            productId={product.id}
            initial={{
              title: product.title || "",
              description: product.description || "",
              priceUsdCents: product.priceUsdCents,
              tags: product.tags.map((t) => t.name),
              isPublishable,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
