"use client";

// Admin-only "Mark payout paid" button. POSTs to /api/webhooks/razorpay to
// simulate the payout webhook. Module 5 will eventually trigger this
// automatically on delivery confirmation.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function MarkPayoutPaidButton({ payoutId }: { payoutId: string }) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onClick() {
    setErr(null);
    startTransition(async () => {
      const res = await fetch(`/api/webhooks/razorpay`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ payoutId, status: "paid" }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setErr(data.error ?? "Could not mark payout paid.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" onClick={onClick} disabled={pending}>
        {pending ? "Marking…" : "Mark paid"}
      </Button>
      {err ? <p className="text-xs text-destructive">{err}</p> : null}
    </div>
  );
}
