"use client";

import { useState, useTransition } from "react";
import { submitShopProfile } from "@/lib/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Category = "handicrafts" | "textiles" | "jewelry";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
  { code: "bn", label: "Bengali" },
  { code: "mr", label: "Marathi" },
];

export type ProfileDefaults = {
  name: string;
  city: string;
  region: string;
  category: Category;
  languages: string[];
  bio: string;
};

export function ProfileForm({ defaults }: { defaults: ProfileDefaults }) {
  const [error, setError] = useState<string | undefined>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [pending, startTransition] = useTransition();

  async function action(formData: FormData) {
    setError(undefined);
    setFieldErrors({});
    startTransition(async () => {
      const result = await submitShopProfile(formData);
      // On redirect, server action throws and we never reach here.
      if (result && !result.ok) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
      }
    });
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      <Field label="Shop name" name="name" error={fieldErrors.name?.[0]}>
        <Input
          id="name"
          name="name"
          defaultValue={defaults.name}
          required
          autoComplete="organization"
          className="h-12 text-base"
          placeholder="Meera’s Block Prints"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="City" name="city" error={fieldErrors.city?.[0]}>
          <Input
            id="city"
            name="city"
            defaultValue={defaults.city}
            required
            autoComplete="address-level2"
            className="h-12 text-base"
            placeholder="Jaipur"
          />
        </Field>
        <Field label="State / region" name="region" error={fieldErrors.region?.[0]}>
          <Input
            id="region"
            name="region"
            defaultValue={defaults.region}
            required
            autoComplete="address-level1"
            className="h-12 text-base"
            placeholder="Rajasthan"
          />
        </Field>
      </div>

      <Field label="Primary category" name="category" error={fieldErrors.category?.[0]}>
        <select
          id="category"
          name="category"
          defaultValue={defaults.category}
          required
          className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="handicrafts">Handicrafts</option>
          <option value="textiles">Textiles</option>
          <option value="jewelry">Jewelry</option>
        </select>
      </Field>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Languages you speak</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {LANGUAGES.map((l) => (
            <label
              key={l.code}
              className="flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                name="languages"
                value={l.code}
                defaultChecked={defaults.languages.includes(l.code)}
                className="h-4 w-4 rounded border-input"
              />
              {l.label}
            </label>
          ))}
        </div>
        {fieldErrors.languages && (
          <p className="text-xs text-destructive">{fieldErrors.languages[0]}</p>
        )}
      </fieldset>

      <Field label="Short bio (optional)" name="bio" error={fieldErrors.bio?.[0]}>
        <textarea
          id="bio"
          name="bio"
          defaultValue={defaults.bio}
          rows={3}
          maxLength={500}
          placeholder="A sentence or two about your craft."
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </Field>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={pending}>
        {pending ? "Saving…" : "Continue"}
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  error,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
