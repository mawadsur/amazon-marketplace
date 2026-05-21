"use client";

// Generic approve/reject form used on shop and product detail pages.
// Posts JSON {reason?} to the matching API route, then router.refresh().

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type Props = {
  approveUrl: string;
  rejectUrl: string;
  /** Optional helper text shown above the textarea. */
  hint?: string;
  /** Hide the approve button (e.g. already-published item). */
  approveDisabled?: boolean;
  /** Hide the reject button (e.g. already-rejected item). */
  rejectDisabled?: boolean;
};

export function ApproveRejectForm({
  approveUrl,
  rejectUrl,
  hint,
  approveDisabled,
  rejectDisabled,
}: Props) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(url: string, requireReason: boolean) {
    setError(null);
    if (requireReason && !reason.trim()) {
      setError("Reason is required for rejection.");
      return;
    }
    startTransition(async () => {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? `Request failed (${res.status})`);
        return;
      }
      setReason("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <div className="space-y-1">
        <Label htmlFor="admin-reason">Reason (required for reject, optional for approve)</Label>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        <textarea
          id="admin-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Notes recorded to the admin audit log…"
          disabled={pending}
        />
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <div className="flex gap-2">
        <Button
          type="button"
          onClick={() => submit(approveUrl, false)}
          disabled={pending || approveDisabled}
        >
          {pending ? "Working…" : "Approve"}
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={() => submit(rejectUrl, true)}
          disabled={pending || rejectDisabled}
        >
          Reject
        </Button>
      </div>
    </div>
  );
}
