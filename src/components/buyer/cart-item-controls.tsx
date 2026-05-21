"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function CartItemControls({
  productId,
  qty,
}: {
  productId: string;
  qty: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setQty(next: number) {
    startTransition(async () => {
      await fetch("/api/cart", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId, qty: next, mode: "set" }),
      });
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      await fetch("/api/cart", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={pending || qty <= 1}
        onClick={() => setQty(qty - 1)}
        aria-label="Decrease quantity"
      >
        −
      </Button>
      <span className="min-w-[2ch] text-center text-sm" aria-live="polite">
        {qty}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => setQty(qty + 1)}
        aria-label="Increase quantity"
      >
        +
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={remove}
        className="text-destructive"
      >
        Remove
      </Button>
    </div>
  );
}
