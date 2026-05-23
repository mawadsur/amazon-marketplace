"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

// Compact teal text-link "Remove from List" for use inside wishlist rows.

export function WishlistRemoveButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      await fetch("/api/wishlist", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="cursor-pointer text-sm text-accent transition-colors duration-150 hover:text-accent/80 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Removing…" : "Remove from List"}
    </button>
  );
}
