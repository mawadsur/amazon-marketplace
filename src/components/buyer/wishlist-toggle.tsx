"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

// Small teal "Add to List" / "Remove from List" text link. Amazon-style.

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
      router.push(
        `/sign-in?next=${encodeURIComponent(window.location.pathname)}`,
      );
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
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="cursor-pointer self-start text-sm text-accent transition-colors duration-150 hover:text-accent/80 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending
          ? "Saving…"
          : wishlisted
            ? "Remove from List"
            : "Add to List"}
      </button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
