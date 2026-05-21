"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateDraft, publishProduct } from "@/lib/listings";

const schema = z.object({
  title: z.string().min(1, "Title required").max(120),
  description: z.string().min(1, "Description required").max(8000),
  priceUsd: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Use dollar format, e.g. 12.50"),
  tags: z.string().max(400),
});
type Values = z.infer<typeof schema>;

interface Props {
  productId: string;
  initial: {
    title: string;
    description: string;
    priceUsdCents: number;
    tags: string[];
    isPublishable: boolean;
  };
}

export function DraftEditor({ productId, initial }: Props) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initial.title,
      description: initial.description,
      priceUsd: (initial.priceUsdCents / 100).toFixed(2),
      tags: initial.tags.join(", "),
    },
  });

  function patchFromValues(v: Values) {
    return {
      title: v.title,
      description: v.description,
      priceUsdCents: Math.round(parseFloat(v.priceUsd) * 100),
      tags: v.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };
  }

  async function onSaveDraft(values: Values) {
    setErr(null);
    setMsg(null);
    startTransition(async () => {
      try {
        await updateDraft(productId, patchFromValues(values));
        setMsg("Saved.");
        router.refresh();
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  async function onPublish() {
    setErr(null);
    setMsg(null);
    const ok = await form.trigger();
    if (!ok) return;
    const values = form.getValues();
    startTransition(async () => {
      try {
        await updateDraft(productId, patchFromValues(values));
        await publishProduct(productId);
        setMsg("Submitted for review.");
        router.refresh();
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Publish failed");
      }
    });
  }

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(onSaveDraft)}>
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" {...form.register("title")} />
        {form.formState.errors.title ? (
          <p className="text-xs text-red-600">{form.formState.errors.title.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          rows={8}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          {...form.register("description")}
        />
        {form.formState.errors.description ? (
          <p className="text-xs text-red-600">
            {form.formState.errors.description.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="priceUsd">Price (USD)</Label>
        <Input id="priceUsd" inputMode="decimal" {...form.register("priceUsd")} />
        {form.formState.errors.priceUsd ? (
          <p className="text-xs text-red-600">{form.formState.errors.priceUsd.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input id="tags" {...form.register("tags")} />
      </div>

      {msg ? <p className="text-sm text-green-700">{msg}</p> : null}
      {err ? <p className="text-sm text-red-600">{err}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Saving…" : "Save draft"}
        </Button>
        <Button type="button" onClick={onPublish} disabled={pending}>
          {pending ? "Working…" : "Publish"}
        </Button>
      </div>
    </form>
  );
}
