"use client";

import { useCallback, useEffect, useState } from "react";

// Live cart-count badge. Fetches /api/cart on mount and whenever a
// 'cart:changed' window event fires (dispatched after add/update/remove).
// Signed-out visitors get a 401 from /api/cart — treated as 0, so the
// badge simply renders nothing rather than breaking the header.

export function CartBadge() {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/cart");
      if (!res.ok) {
        setCount(0);
        return;
      }
      const data = await res.json();
      const next = data?.totals?.itemCount;
      setCount(typeof next === "number" ? next : 0);
    } catch {
      setCount(0);
    }
  }, []);

  useEffect(() => {
    refresh();
    const onChanged = () => {
      refresh();
    };
    window.addEventListener("cart:changed", onChanged);
    return () => {
      window.removeEventListener("cart:changed", onChanged);
    };
  }, [refresh]);

  if (count <= 0) return null;

  return (
    <span className="absolute -right-1.5 -top-1.5 min-w-[18px] rounded-full bg-primary px-1 text-center text-[11px] font-bold text-primary-foreground">
      {count > 99 ? "99+" : count}
    </span>
  );
}
