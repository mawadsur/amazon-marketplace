"use client";

// Pay-now button for the dev "Stripe" stub page. POSTs to the webhook handler
// to simulate the payment completing, then redirects to the success page.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function PayNowButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function pay() {
    setSubmitting(true);
    setErr(null);
    try {
      const res = await fetch("/api/webhooks/stripe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setErr(data.error ?? "Payment failed (stub).");
        setSubmitting(false);
        return;
      }
      router.push(`/checkout/success/${orderId}`);
    } catch {
      setErr("Network error.");
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button onClick={pay} disabled={submitting} size="lg" className="w-full">
        {submitting ? "Processing…" : "Pay now (stub)"}
      </Button>
      {err ? <p className="text-sm text-destructive">{err}</p> : null}
    </div>
  );
}
