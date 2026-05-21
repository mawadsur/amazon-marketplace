"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function AddToCartButton({
  productId,
  isAuthed,
}: {
  productId: string;
  isAuthed: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    if (!isAuthed) {
      router.push(`/sign-in?next=${encodeURIComponent(window.location.pathname)}`);
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
      setDone(true);
      router.refresh();
      setTimeout(() => setDone(false), 1500);
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <Button onClick={onClick} disabled={pending}>
        {pending ? "Adding..." : done ? "Added to cart" : "Add to cart"}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
