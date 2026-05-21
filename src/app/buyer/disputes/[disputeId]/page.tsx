// /buyer/disputes/[disputeId] — buyer's view of a single dispute.

import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { MarketplaceNav } from "@/components/buyer/marketplace-nav";
import { DisputeStatusPill } from "@/components/safety/dispute-status-pill";
import { auth } from "@/lib/auth";
import { getDisputeForBuyer } from "@/lib/disputes";
import { formatUsd } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const REASON_LABELS: Record<string, string> = {
  NOT_RECEIVED: "Item not received",
  NOT_AS_DESCRIBED: "Not as described",
  DAMAGED: "Damaged on arrival",
  COUNTERFEIT: "Counterfeit",
  OTHER: "Other",
};

export default async function BuyerDisputeDetailPage({
  params,
}: {
  params: Promise<{ disputeId: string }>;
}) {
  const { disputeId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(
      `/sign-in?next=${encodeURIComponent(`/buyer/disputes/${disputeId}`)}`,
    );
  }

  const dispute = await getDisputeForBuyer(disputeId);
  if (!dispute) notFound();
  if (dispute.openedById !== session.user.id) notFound();

  const order = dispute.order;

  return (
    <>
      <MarketplaceNav />
      <main className="container mx-auto max-w-3xl px-4 py-10">
        <Link
          href="/buyer/disputes"
          className="text-xs text-muted-foreground underline"
        >
          ← All disputes
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            Dispute on order #{dispute.orderId.slice(-8)}
          </h1>
          <DisputeStatusPill value={dispute.status} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Opened {new Date(dispute.openedAt).toLocaleString()}
        </p>

        <div className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Your claim</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                <span className="font-medium">Reason:</span>{" "}
                {REASON_LABELS[dispute.reason] ?? dispute.reason}
              </p>
              <p className="whitespace-pre-wrap">{dispute.description}</p>
              {dispute.evidenceUrls.length > 0 ? (
                <div>
                  <p className="font-medium">Evidence</p>
                  <ul className="mt-1 space-y-1">
                    {dispute.evidenceUrls.map((u) => (
                      <li key={u}>
                        <a
                          href={u}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="break-all text-blue-700 underline"
                        >
                          {u}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {dispute.resolution ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Resolution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="whitespace-pre-wrap">{dispute.resolution}</p>
                {dispute.resolvedAt ? (
                  <p className="text-xs text-muted-foreground">
                    Resolved {new Date(dispute.resolvedAt).toLocaleString()}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                Our team will review your dispute and update this page when a
                decision is made.
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Order</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <ul className="space-y-2">
                {order.items.map((it) => (
                  <li key={it.id} className="flex items-start gap-3">
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                      {it.product.images[0]?.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={it.product.images[0].url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/products/${it.product.slug}`}
                        className="truncate font-medium hover:underline"
                      >
                        {it.product.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {it.product.shop.name} · qty {it.qty}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="flex items-baseline justify-between border-t pt-2 text-sm font-semibold">
                <span>Total</span>
                <span className="tabular-nums">
                  {formatUsd(order.totalUsdCents)}
                </span>
              </div>
              <Link
                href={`/buyer/orders/${order.id}`}
                className="text-xs underline"
              >
                View full order →
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
