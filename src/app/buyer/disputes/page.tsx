// /buyer/disputes — list of disputes the signed-in buyer has opened.

import Link from "next/link";
import { redirect } from "next/navigation";
import { MarketplaceNav } from "@/components/buyer/marketplace-nav";
import { DisputeStatusPill } from "@/components/safety/dispute-status-pill";
import { auth } from "@/lib/auth";
import { listDisputesForBuyer } from "@/lib/disputes";
import { formatUsd } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function BuyerDisputesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/sign-in?next=${encodeURIComponent("/buyer/disputes")}`);
  }

  const disputes = await listDisputesForBuyer(session.user.id);

  return (
    <>
      <MarketplaceNav />
      <main className="container mx-auto max-w-4xl px-4 py-10">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Your disputes
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {disputes.length} dispute{disputes.length === 1 ? "" : "s"}
            </p>
          </div>
          <Link href="/buyer/orders" className="text-sm underline">
            All orders
          </Link>
        </div>

        <section className="mt-8 space-y-3">
          {disputes.length === 0 ? (
            <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
              You haven&apos;t opened any disputes. If something went wrong with
              an order, open one from{" "}
              <Link href="/buyer/orders" className="underline">
                your orders
              </Link>
              .
            </div>
          ) : (
            disputes.map((d) => (
              <Link
                key={d.id}
                href={`/buyer/disputes/${d.id}`}
                className="flex items-center justify-between gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">
                      Order #{d.order.id.slice(-8)}
                    </p>
                    <DisputeStatusPill value={d.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {d.reason.toLowerCase().replace(/_/g, " ")} · opened{" "}
                    {new Date(d.openedAt).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-sm font-semibold tabular-nums">
                  {formatUsd(d.order.totalUsdCents)}
                </p>
              </Link>
            ))
          )}
        </section>
      </main>
    </>
  );
}
