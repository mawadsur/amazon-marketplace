"use client";

import { useState, useTransition } from "react";
import { submitBankAccount } from "@/lib/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Defaults = { accountHolderName: string; ifsc: string };

export function BankForm({ defaults }: { defaults: Defaults }) {
  const [error, setError] = useState<string | undefined>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [pending, startTransition] = useTransition();

  async function action(formData: FormData) {
    setError(undefined);
    setFieldErrors({});
    startTransition(async () => {
      const result = await submitBankAccount(formData);
      if (result && !result.ok) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
      }
    });
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="accountHolderName">Account holder name</Label>
        <Input
          id="accountHolderName"
          name="accountHolderName"
          defaultValue={defaults.accountHolderName}
          required
          autoComplete="name"
          className="h-12 text-base"
          placeholder="As printed on your passbook"
        />
        {fieldErrors.accountHolderName && (
          <p className="text-xs text-destructive">{fieldErrors.accountHolderName[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="accountNumber">Account number</Label>
        <Input
          id="accountNumber"
          name="accountNumber"
          required
          inputMode="numeric"
          autoComplete="off"
          className="h-12 text-base font-mono"
          placeholder="0123456789"
        />
        {fieldErrors.accountNumber && (
          <p className="text-xs text-destructive">{fieldErrors.accountNumber[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="ifsc">IFSC code</Label>
        <Input
          id="ifsc"
          name="ifsc"
          defaultValue={defaults.ifsc}
          required
          autoComplete="off"
          className="h-12 text-base font-mono uppercase"
          placeholder="HDFC0001234"
          style={{ textTransform: "uppercase" }}
        />
        {fieldErrors.ifsc && (
          <p className="text-xs text-destructive">{fieldErrors.ifsc[0]}</p>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={pending}>
        {pending ? "Linking…" : "Link account & finish"}
      </Button>
    </form>
  );
}
