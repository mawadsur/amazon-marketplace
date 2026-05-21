// /admin/disputes — admin queue of disputes.
// Default filter shows OPEN + UNDER_REVIEW. Users can switch to "all" via
// the ?status=all query string. Replaces the empty-state placeholder.

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { StatusPill } from "@/components/admin/status-pill";
import { DisputeStatusPill } from "@/components/safety/dispute-status-pill";
import { listDisputesForAdmin } from "@/lib/disputes";
import { formatUsd } from "@/lib/format";

export const dynamic = "force-dynamic";

type SP = { status?: string };

export default async function AdminDisputesPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const showAll = sp.status === "all";

  const disputes = await listDisputesForAdmin(
    showAll ? { openOnly: false } : { openOnly: true },
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Disputes</h1>
          <p className="text-sm text-muted-foreground">
            {showAll
              ? "Showing all disputes."
              : "Showing open and under-review disputes."}
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <Link
            href="/admin/disputes"
            className={
              !showAll
                ? "rounded-md border border-primary bg-primary/10 px-3 py-1 font-medium"
                : "rounded-md border px-3 py-1 hover:bg-accent"
            }
          >
            Open
          </Link>
          <Link
            href="/admin/disputes?status=all"
            className={
              showAll
                ? "rounded-md border border-primary bg-primary/10 px-3 py-1 font-medium"
                : "rounded-md border px-3 py-1 hover:bg-accent"
            }
          >
            All
          </Link>
        </div>
      </div>

      {disputes.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {showAll
              ? "No disputes have ever been opened."
              : "No open disputes — nothing to review."}
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {disputes.map((d) => (
            <li key={d.id}>
              <Link
                href={`/admin/disputes/${d.id}`}
                className="flex items-center justify-between gap-4 rounded-lg border bg-card p-3 transition-colors hover:bg-accent"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">
                      Order #{d.orderId.slice(-8)}
                    </span>
                    <DisputeStatusPill value={d.status} />
                    <StatusPill value={d.order.status} />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {d.reason.toLowerCase().replace(/_/g, " ")} · opened by{" "}
                    {d.openedBy.email ?? d.openedBy.name ?? d.openedBy.phone ?? "buyer"} ·{" "}
                    {new Date(d.openedAt).toLocaleDateString()}
                  </div>
                </div>
                <p className="text-sm font-semibold tabular-nums">
                  {formatUsd(d.order.totalUsdCents)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
