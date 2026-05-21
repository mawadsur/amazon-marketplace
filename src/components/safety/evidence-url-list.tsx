"use client";

// Tiny repeating-URL input. Renders N text fields (default 3), reports the
// current values up via onChange. URLs are kept loose — the API route does
// the real validation with Zod.

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EvidenceUrlList({
  values,
  onChange,
  count = 3,
  disabled,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  count?: number;
  disabled?: boolean;
}) {
  // Pad/trim the slot array to `count` so we always render N inputs.
  const slots: string[] = [];
  for (let i = 0; i < count; i++) slots.push(values[i] ?? "");

  function setAt(idx: number, value: string) {
    const next = slots.slice();
    next[idx] = value;
    onChange(next);
  }

  return (
    <div className="space-y-2">
      <Label>Evidence URLs (optional)</Label>
      <p className="text-xs text-muted-foreground">
        Paste links to photos, videos, or chat screenshots that support your
        claim. Up to {count} URLs.
      </p>
      <div className="space-y-2">
        {slots.map((v, i) => (
          <Input
            key={i}
            type="url"
            inputMode="url"
            placeholder="https://…"
            value={v}
            onChange={(e) => setAt(i, e.target.value)}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}
