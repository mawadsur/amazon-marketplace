"use client";

// Shipping-address form + Place-order action. Talks to /api/checkout, then
// navigates the browser to the returned checkoutUrl (Stripe stub URL).

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FieldErrors = Partial<Record<keyof FormState, string>>;

type FormState = {
  fullName: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  phone: string;
};

const initial: FormState = {
  fullName: "",
  line1: "",
  line2: "",
  city: "",
  region: "",
  postalCode: "",
  country: "United States",
  phone: "",
};

export function CheckoutForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [topError, setTopError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function validate(): FieldErrors {
    const e: FieldErrors = {};
    if (form.fullName.trim().length < 2) e.fullName = "Required";
    if (form.line1.trim().length < 2) e.line1 = "Required";
    if (form.city.trim().length < 1) e.city = "Required";
    if (form.region.trim().length < 1) e.region = "Required";
    if (form.postalCode.trim().length < 2) e.postalCode = "Required";
    if (form.country.trim().length < 2) e.country = "Required";
    return e;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setTopError(null);
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          shippingAddress: {
            fullName: form.fullName.trim(),
            line1: form.line1.trim(),
            line2: form.line2.trim() || undefined,
            city: form.city.trim(),
            region: form.region.trim(),
            postalCode: form.postalCode.trim(),
            country: form.country.trim(),
            phone: form.phone.trim() || undefined,
          },
        }),
      });
      const data = (await res.json()) as { checkoutUrl?: string; error?: string };
      if (!res.ok || !data.checkoutUrl) {
        setTopError(data.error ?? "Could not place order. Please try again.");
        setSubmitting(false);
        return;
      }
      // Navigate to the (stub) Stripe checkout page.
      router.push(data.checkoutUrl);
    } catch {
      setTopError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field id="fullName" label="Full name" error={errors.fullName}>
        <Input
          id="fullName"
          value={form.fullName}
          onChange={(e) => set("fullName", e.target.value)}
          autoComplete="name"
          required
        />
      </Field>
      <Field id="line1" label="Address line 1" error={errors.line1}>
        <Input
          id="line1"
          value={form.line1}
          onChange={(e) => set("line1", e.target.value)}
          autoComplete="address-line1"
          required
        />
      </Field>
      <Field id="line2" label="Address line 2 (optional)" error={errors.line2}>
        <Input
          id="line2"
          value={form.line2}
          onChange={(e) => set("line2", e.target.value)}
          autoComplete="address-line2"
        />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="city" label="City" error={errors.city}>
          <Input
            id="city"
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
            autoComplete="address-level2"
            required
          />
        </Field>
        <Field id="region" label="State / Region" error={errors.region}>
          <Input
            id="region"
            value={form.region}
            onChange={(e) => set("region", e.target.value)}
            autoComplete="address-level1"
            required
          />
        </Field>
        <Field id="postalCode" label="Postal code" error={errors.postalCode}>
          <Input
            id="postalCode"
            value={form.postalCode}
            onChange={(e) => set("postalCode", e.target.value)}
            autoComplete="postal-code"
            required
          />
        </Field>
        <Field id="country" label="Country" error={errors.country}>
          <Input
            id="country"
            value={form.country}
            onChange={(e) => set("country", e.target.value)}
            autoComplete="country-name"
            required
          />
        </Field>
      </div>
      <Field id="phone" label="Phone (optional)" error={errors.phone}>
        <Input
          id="phone"
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
          autoComplete="tel"
          type="tel"
        />
      </Field>

      {topError ? (
        <p className="text-sm text-destructive" role="alert">
          {topError}
        </p>
      ) : null}

      <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? "Placing order…" : "Place order"}
      </Button>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
