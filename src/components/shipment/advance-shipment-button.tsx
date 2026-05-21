"use client";

// Dev-only helper button used on the seller shipment page. POSTs to
// /api/shipments/[id]/advance which advances the shipment one step in
// the lifecycle (and on DELIVERED triggers payout-paid via shipments.ts).

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function AdvanceShipmentButton({ shipmentId }: { shipmentId: string }) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onClick() {
    setErr(null);
    startTransition(async () => {
      const res = await fetch(`/api/shipments/${shipmentId}/advance`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setErr(data.error ?? "Could not advance shipment.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <Button onClick={onClick} disabled={pending} variant="secondary">
        {pending ? "Advancing…" : "Advance status (dev)"}
      </Button>
      {err ? <p className="text-sm text-destructive">{err}</p> : null}
    </div>
  );
}
