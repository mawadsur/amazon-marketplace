"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const phoneSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^\+?\d{8,19}$/, "Enter a valid phone with country code, e.g. +91…"),
});

const codeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

type PhoneValues = z.infer<typeof phoneSchema>;
type CodeValues = z.infer<typeof codeSchema>;

type Step = "phone" | "code";

export function SignInForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [devCode, setDevCode] = useState<string | undefined>();
  const [serverError, setServerError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  const phoneForm = useForm<PhoneValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "" },
  });

  const codeForm = useForm<CodeValues>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: "" },
  });

  async function onSendCode(values: PhoneValues) {
    setServerError(undefined);
    startTransition(async () => {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone: values.phone }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setServerError(body.error ?? "Failed to send code");
        return;
      }
      const body = (await res.json()) as { sent: boolean; devCode?: string };
      setPhone(values.phone);
      setDevCode(body.devCode);
      setStep("code");
    });
  }

  async function onVerify(values: CodeValues) {
    setServerError(undefined);
    startTransition(async () => {
      const result = await signIn("phone-otp", {
        phone,
        code: values.code,
        redirect: false,
        callbackUrl,
      });
      if (!result || result.error) {
        setServerError("That code didn’t work. Try again or resend.");
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    });
  }

  if (step === "phone") {
    return (
      <form
        onSubmit={phoneForm.handleSubmit(onSendCode)}
        className="space-y-4"
        noValidate
      >
        <div className="space-y-2">
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+91 98765 43210"
            className="h-12 text-base"
            {...phoneForm.register("phone")}
          />
          {phoneForm.formState.errors.phone && (
            <p className="text-xs text-destructive">
              {phoneForm.formState.errors.phone.message}
            </p>
          )}
        </div>
        {serverError && <p className="text-sm text-destructive">{serverError}</p>}
        <Button type="submit" size="lg" className="w-full h-12 text-base" disabled={pending}>
          {pending ? "Sending…" : "Send code"}
        </Button>
        <p className="text-xs text-muted-foreground">
          By continuing you agree to our terms. Standard SMS rates may apply.
        </p>
      </form>
    );
  }

  return (
    <form
      onSubmit={codeForm.handleSubmit(onVerify)}
      className="space-y-4"
      noValidate
    >
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          Code sent to <span className="font-medium text-foreground">{phone}</span>
        </p>
        {devCode && (
          <p className="rounded-md border border-dashed border-border bg-muted/40 px-3 py-2 text-xs">
            Dev mode: use code <span className="font-mono font-semibold">{devCode}</span>
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="code">6-digit code</Label>
        <Input
          id="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="123456"
          className="h-12 text-center text-2xl tracking-[0.5em]"
          {...codeForm.register("code")}
        />
        {codeForm.formState.errors.code && (
          <p className="text-xs text-destructive">
            {codeForm.formState.errors.code.message}
          </p>
        )}
      </div>
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <Button type="submit" size="lg" className="w-full h-12 text-base" disabled={pending}>
        {pending ? "Verifying…" : "Verify & continue"}
      </Button>
      <button
        type="button"
        onClick={() => {
          setStep("phone");
          setServerError(undefined);
        }}
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        Use a different number
      </button>
    </form>
  );
}
