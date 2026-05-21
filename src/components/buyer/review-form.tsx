"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function ReviewForm({
  productId,
  isAuthed,
  isBuyer,
}: {
  productId: string;
  isAuthed: boolean;
  isBuyer: boolean;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!isAuthed) {
    return (
      <p className="text-sm text-muted-foreground">
        <a className="underline" href="/sign-in">
          Sign in
        </a>{" "}
        to leave a review.
      </p>
    );
  }
  if (!isBuyer) {
    return (
      <p className="text-sm text-muted-foreground">
        Only buyer accounts can leave reviews.
      </p>
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId, rating, body: body || undefined }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j?.error ?? `error_${res.status}`);
        return;
      }
      setDone(true);
      setBody("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-lg border p-4">
      <div>
        <Label htmlFor="rating">Rating</Label>
        <select
          id="rating"
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="ml-2 rounded-md border border-input bg-background px-2 py-1 text-sm"
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} star{n === 1 ? "" : "s"}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="body">Review</Label>
        <textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="mt-1 block min-h-[80px] w-full rounded-md border border-input bg-background p-2 text-sm"
          placeholder="Share what you thought..."
        />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Submitting..." : "Submit review"}
        </Button>
        {done ? <p className="text-sm text-muted-foreground">Thanks for your review!</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </form>
  );
}
