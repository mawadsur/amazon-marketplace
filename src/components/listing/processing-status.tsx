"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StatusPill, type Pill } from "@/components/listing/status-pill";

type JobKind =
  | "BACKGROUND_REMOVAL"
  | "DESCRIPTION"
  | "PRICING_SUGGESTION"
  | "CATEGORIZATION"
  | "TRANSLATION"
  | "LIFESTYLE_PHOTO"
  | "SEARCH_INTENT";

interface JobRow {
  id: string;
  kind: JobKind;
  status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED";
  error: string | null;
}

interface PollResp {
  product: { id: string; status: string; title: string; priceUsdCents: number };
  jobs: JobRow[];
  total: number;
  succeeded: number;
  failed: number;
  done: boolean;
}

const LABEL: Record<JobKind, string> = {
  BACKGROUND_REMOVAL: "Removing background",
  DESCRIPTION: "Writing description",
  PRICING_SUGGESTION: "Suggesting price",
  CATEGORIZATION: "Categorizing",
  TRANSLATION: "Translating",
  LIFESTYLE_PHOTO: "Lifestyle photo",
  SEARCH_INTENT: "Search tagging",
};

const ORDER: JobKind[] = [
  "BACKGROUND_REMOVAL",
  "DESCRIPTION",
  "PRICING_SUGGESTION",
  "CATEGORIZATION",
];

export function ProcessingStatus({ productId }: { productId: string }) {
  const router = useRouter();
  const [state, setState] = useState<PollResp | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function tick() {
      try {
        const res = await fetch(`/api/products/${productId}/jobs`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`status_${res.status}`);
        const data = (await res.json()) as PollResp;
        if (cancelled) return;
        setState(data);
        if (data.done && data.failed === 0) {
          router.replace(`/seller/products/${productId}`);
          return;
        }
        timer = setTimeout(tick, 1200);
      } catch (e) {
        if (cancelled) return;
        setErr(e instanceof Error ? e.message : "poll failed");
        timer = setTimeout(tick, 3000);
      }
    }
    tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [productId, router]);

  const byKind = new Map(state?.jobs.map((j) => [j.kind, j]) ?? []);

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {ORDER.map((kind) => {
          const job = byKind.get(kind);
          const status: Pill = job?.status ?? "QUEUED";
          return (
            <li
              key={kind}
              className="flex items-center justify-between rounded-md border bg-card px-4 py-3"
            >
              <span className="text-sm">{LABEL[kind]}</span>
              <StatusPill value={status} />
            </li>
          );
        })}
      </ul>

      {state ? (
        <p className="text-sm text-muted-foreground">
          {state.succeeded} / {state.total} done
          {state.failed > 0 ? ` (${state.failed} failed)` : ""}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">Loading…</p>
      )}

      {err ? (
        <p className="text-xs text-muted-foreground">
          (Polling hiccup: {err}. Retrying…)
        </p>
      ) : null}
    </div>
  );
}
