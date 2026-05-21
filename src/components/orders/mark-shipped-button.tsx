"use client";

// Seller-side "Mark shipped" action. POSTs to the seller ship route and
// refreshes the current page.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function MarkShippedButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onClick() {
    setErr(null);
    startTransition(async () => {
      const res = await fetch(`/api/seller/orders/${orderId}/ship`, { method: "POST" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setErr(data.error ?? "Could not mark as shipped.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <Button onClick={onClick} disabled={pending}>
        {pending ? "Marking…" : "Mark shipped"}
      </Button>
      {err ? <p className="text-sm text-destructive">{err}</p> : null}
    </div>
  );
}
