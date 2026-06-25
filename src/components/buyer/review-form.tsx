"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";

// Amazon-style review form: thin-bordered card, "Write a review" header,
// 5-clickable-star rating, textarea, small yellow Submit button.

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
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!isAuthed) {
    return (
      <p className="text-sm text-muted-foreground">
        <a className="cursor-pointer text-accent hover:underline" href="/sign-in">
          Sign in
        </a>{" "}
        to write a review.
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

  const displayedRating = hoverRating ?? rating;

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-md border border-border bg-background p-4"
    >
      <h3 className="text-sm font-medium text-muted-foreground">
        Write a review
      </h3>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            onMouseEnter={() => setHoverRating(n)}
            onMouseLeave={() => setHoverRating(null)}
            onClick={() => setRating(n)}
            className="cursor-pointer rounded-sm p-1 transition-colors duration-150 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <Star
              className={`h-5 w-5 ${
                n <= displayedRating
                  ? "fill-amber-400 text-amber-400"
                  : "text-border"
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-xs text-muted-foreground">
          {rating}/5
        </span>
      </div>
      <div>
        <label htmlFor="review-body" className="sr-only">
          Review
        </label>
        <textarea
          id="review-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="block min-h-[80px] w-full rounded-md border border-border bg-background p-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="What did you think of this product?"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex cursor-pointer items-center justify-center rounded-md border border-primary bg-primary px-4 py-2 text-sm font-semibold uppercase tracking-wide text-primary-foreground shadow-sm transition-colors duration-150 hover:bg-[#9D174D] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Submitting…" : "Submit"}
        </button>
        {done ? (
          <p className="text-sm text-muted-foreground">Thanks for your review.</p>
        ) : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </form>
  );
}
