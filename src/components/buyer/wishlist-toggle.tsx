"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function WishlistToggle({
  productId,
  isAuthed,
  initialWishlisted,
}: {
  productId: string;
  isAuthed: boolean;
  initialWishlisted: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    if (!isAuthed) {
      router.push(`/sign-in?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setError(null);
    const next = !wishlisted;
    startTransition(async () => {
      const res = await fetch("/api/wishlist", {
        method: next ? "POST" : "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error ?? `error_${res.status}`);
        return;
      }
      setWishlisted(next);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <Button variant="outline" onClick={onClick} disabled={pending}>
        {pending
          ? "Saving..."
          : wishlisted
            ? "Saved to wishlist"
            : "Add to wishlist"}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
