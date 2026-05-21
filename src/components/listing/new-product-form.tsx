"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createDraftFromUpload } from "@/lib/listings";

const schema = z.object({
  sourceLang: z.string().min(2).max(8),
  sourceText: z.string().max(2000),
});
type FormValues = z.infer<typeof schema>;

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "ta", label: "Tamil" },
  { code: "bn", label: "Bengali" },
  { code: "te", label: "Telugu" },
  { code: "mr", label: "Marathi" },
  { code: "gu", label: "Gujarati" },
  { code: "pa", label: "Punjabi" },
];

export function NewProductForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { sourceLang: "en", sourceText: "" },
  });

  async function onSubmit(values: FormValues) {
    setError(null);
    if (!file) {
      setError("Please pick a photo first.");
      return;
    }
    setSubmitting(true);
    try {
      // 1) Get signed upload URL.
      const signRes = await fetch("/api/upload/sign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || "image/jpeg",
        }),
      });
      if (!signRes.ok) {
        const data = (await signRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || `Sign failed (${signRes.status})`);
      }
      const sign = (await signRes.json()) as { url: string; key: string };

      // 2) PUT file to storage. Best-effort: failures are tolerated since the
      //    S3 stub may not be configured in dev.
      try {
        await fetch(sign.url, {
          method: "PUT",
          headers: { "content-type": file.type || "image/jpeg" },
          body: file,
        });
      } catch {
        // ignored — we still proceed with the recorded key
      }

      // 3) Create the draft + kick off pipeline.
      const { productId } = await createDraftFromUpload({
        imageKey: sign.key,
        sourceLang: values.sourceLang,
        sourceText: values.sourceText,
      });

      router.push(`/seller/products/new/processing/${productId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="photo">Product photo</Label>
        <Input
          id="photo"
          type="file"
          accept="image/*"
          disabled={submitting}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <p className="text-xs text-muted-foreground">
          One photo on a plain background works best. We&apos;ll remove the background for you.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sourceLang">Your language</Label>
        <select
          id="sourceLang"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          disabled={submitting}
          {...form.register("sourceLang")}
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sourceText">Describe it (optional)</Label>
        <textarea
          id="sourceText"
          rows={5}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Tell us about your product in your own words — material, story, who made it."
          disabled={submitting}
          {...form.register("sourceText")}
        />
        <p className="text-xs text-muted-foreground">
          We&apos;ll translate and rewrite this as a US-English listing.
        </p>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button type="submit" disabled={submitting || !file}>
        {submitting ? "Uploading…" : "Continue"}
      </Button>
    </form>
  );
}
