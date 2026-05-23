"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

// Amazon-style cart row controls: tiny Qty select + teal text links
// for Delete / Save for later. All inline in one row.

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

  function saveForLater() {
    startTransition(async () => {
      // Add to wishlist, then remove from cart.
      await fetch("/api/wishlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      await fetch("/api/cart", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
      <label className="inline-flex items-center gap-1.5 text-foreground">
        <span className="text-muted-foreground">Qty:</span>
        <select
          aria-label="Quantity"
          disabled={pending}
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
          className="h-8 cursor-pointer rounded-md border border-border bg-background px-2 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <span className="text-border" aria-hidden="true">
        |
      </span>
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        className="cursor-pointer text-accent transition-colors duration-150 hover:text-accent/80 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
      >
        Delete
      </button>
      <span className="text-border" aria-hidden="true">
        |
      </span>
      <button
        type="button"
        onClick={saveForLater}
        disabled={pending}
        className="cursor-pointer text-accent transition-colors duration-150 hover:text-accent/80 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
      >
        Save for later
      </button>
    </div>
  );
}
