"use client";

import { useState, useTransition } from "react";
import { submitKyc } from "@/lib/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Defaults = { gstNumber: string; panNumber: string; udyamNumber: string };

export function KycForm({ defaults }: { defaults: Defaults }) {
  const [error, setError] = useState<string | undefined>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [pending, startTransition] = useTransition();

  async function action(formData: FormData) {
    setError(undefined);
    setFieldErrors({});
    startTransition(async () => {
      const result = await submitKyc(formData);
      if (result && !result.ok) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
      }
    });
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="gstNumber">GST number</Label>
        <Input
          id="gstNumber"
          name="gstNumber"
          defaultValue={defaults.gstNumber}
          className="h-12 text-base font-mono"
          placeholder="22AAAAA0000A1Z5"
          autoComplete="off"
        />
        {fieldErrors.gstNumber && (
          <p className="text-xs text-destructive">{fieldErrors.gstNumber[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="panNumber">PAN number</Label>
        <Input
          id="panNumber"
          name="panNumber"
          defaultValue={defaults.panNumber}
          className="h-12 text-base font-mono"
          placeholder="ABCDE1234F"
          autoComplete="off"
        />
        {fieldErrors.panNumber && (
          <p className="text-xs text-destructive">{fieldErrors.panNumber[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="udyamNumber">Udyam (MSME) number</Label>
        <Input
          id="udyamNumber"
          name="udyamNumber"
          defaultValue={defaults.udyamNumber}
          className="h-12 text-base font-mono"
          placeholder="UDYAM-XX-00-0000000"
          autoComplete="off"
        />
        {fieldErrors.udyamNumber && (
          <p className="text-xs text-destructive">{fieldErrors.udyamNumber[0]}</p>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        At least one of GST, PAN, or Udyam is required.
      </p>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={pending}>
        {pending ? "Verifying…" : "Verify & continue"}
      </Button>
    </form>
  );
}
