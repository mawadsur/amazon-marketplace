"use client";

// Dismissible cookie-consent banner. Pure client component — no server imports
// (keeps env/prisma out of the browser bundle). Choice is persisted in
// localStorage so it shows once; non-blocking, keyboard-accessible, theme-tokened.

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

const STORAGE_KEY = "mirage.cookie-consent";

export function CookieBanner() {
  // Start hidden; reveal only after we confirm no prior choice (avoids SSR flash).
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      // localStorage unavailable (private mode) — don't nag.
    }
  }, []);

  function resolve(choice: "accepted" | "declined") {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // ignore persistence failures
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-[120] px-4 pb-4 sm:px-6"
    >
      <div className="container mx-auto max-w-4xl rounded-lg border border-border bg-card p-4 shadow-lg sm:flex sm:items-center sm:gap-4 sm:p-5">
        <p className="text-sm leading-relaxed text-muted-foreground">
          We use cookies to keep your cart, remember preferences, and understand
          how Mirage is used. See our{" "}
          <Link href="/legal/privacy" className="amzn-link font-medium">
            Privacy Policy
          </Link>
          .
        </p>
        <div className="mt-3 flex flex-shrink-0 items-center gap-2 sm:mt-0">
          <button
            type="button"
            onClick={() => resolve("declined")}
            className="mirage-button-outline h-9 px-4 text-xs"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => resolve("accepted")}
            className="amzn-button-yellow h-9 px-4 text-xs"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={() => resolve("declined")}
            aria-label="Dismiss cookie notice"
            className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
