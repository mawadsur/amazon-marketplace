"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { regenerateAvatarVideo } from "@/lib/listings";

type Status = "NONE" | "QUEUED" | "RUNNING" | "READY" | "FAILED";

export function AvatarVideoCard({
  productId,
  status,
  url,
  poster,
}: {
  productId: string;
  status: Status;
  url: string | null;
  poster: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function run() {
    setErr(null);
    startTransition(async () => {
      try {
        await regenerateAvatarVideo(productId);
        router.refresh();
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Could not start generation");
      }
    });
  }

  const generating = status === "QUEUED" || status === "RUNNING";

  return (
    <div className="space-y-3">
      {status === "READY" && url ? (
        <video
          src={url}
          poster={poster ?? undefined}
          muted
          loop
          playsInline
          controls
          className="aspect-square w-48 rounded-md border border-border object-cover"
        />
      ) : generating ? (
        <p className="text-sm text-muted-foreground">
          Generating your try-on video… this can take a couple of minutes. It will
          appear here and on the product page when ready.
        </p>
      ) : status === "FAILED" ? (
        <p className="text-sm text-red-600">
          Video generation failed. You can retry below.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">No try-on video yet.</p>
      )}

      {err ? <p className="text-sm text-red-600">{err}</p> : null}

      <Button type="button" variant="outline" onClick={run} disabled={pending || generating}>
        {pending
          ? "Starting…"
          : generating
            ? "Generating…"
            : status === "READY"
              ? "Regenerate video"
              : status === "FAILED"
                ? "Retry"
                : "Generate try-on video"}
      </Button>
    </div>
  );
}
