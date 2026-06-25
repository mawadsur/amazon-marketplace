"use client";

// Pay-now button for the dev "Stripe" stub page. Yellow Amazon pill style.
// POSTs to the webhook handler to simulate the payment completing, then
// redirects to the success page.

import { useState } from "react";
import { useRouter } from "next/navigation";

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
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
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
      <button
        type="button"
        onClick={pay}
        disabled={submitting}
        className="inline-flex w-full cursor-pointer items-center justify-center rounded-md border border-primary bg-primary px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-primary-foreground shadow-sm transition-colors duration-150 hover:bg-[#9D174D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Processing…" : "Pay now"}
      </button>
      {err ? <p className="text-sm text-destructive">{err}</p> : null}
    </div>
  );
}
