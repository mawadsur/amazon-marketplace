"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

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
    <Button variant="ghost" size="sm" disabled={pending} onClick={onClick} className="text-destructive">
      Remove
    </Button>
  );
}
