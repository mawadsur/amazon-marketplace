"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

// Mirage editorial CTA. "yellow" variant = primary wine "Buy Now",
// "orange" variant = secondary gold "Add to Cart". Rectangular, uppercase.

export function AddToCartButton({
  productId,
  isAuthed,
  variant = "orange",
  label,
  buyNow = false,
}: {
  productId: string;
  isAuthed: boolean;
  variant?: "orange" | "yellow";
  label?: string;
  buyNow?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseColors =
    variant === "yellow"
      ? "bg-primary text-primary-foreground hover:bg-[#611A33] border border-primary"
      : "bg-secondary text-secondary-foreground hover:bg-[#A87E2F] border border-secondary";

  function onClick() {
    if (!isAuthed) {
      router.push(
        `/sign-in?next=${encodeURIComponent(window.location.pathname)}`,
      );
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId, qty: 1, mode: "add" }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error ?? `error_${res.status}`);
        return;
      }
      if (buyNow) {
        router.push("/checkout");
        return;
      }
      setDone(true);
      window.dispatchEvent(new Event("cart:changed"));
      router.refresh();
      setTimeout(() => setDone(false), 1500);
    });
  }

  const defaultLabel = buyNow
    ? "Buy Now"
    : variant === "yellow"
      ? "Buy Now"
      : "Add to Cart";
  const renderLabel = pending
    ? buyNow
      ? "Continuing…"
      : "Adding…"
    : done
      ? "Added to Cart"
      : (label ?? defaultLabel);

  return (
    <div className="flex w-full flex-col gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className={`w-full cursor-pointer rounded-sm px-4 py-2.5 text-sm font-semibold uppercase tracking-wide shadow-sm transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60 ${baseColors}`}
      >
        {renderLabel}
      </button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
