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

const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

const registerSchema = z
  .object({
    name: z.string().trim().max(80).optional(),
    email: z.string().trim().email("Enter a valid email"),
    password: z.string().min(8, "At least 8 characters"),
    confirm: z.string().min(1, "Re-enter your password"),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Passwords don't match",
  });

type SignInValues = z.infer<typeof signInSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

type Mode = "signin" | "register";

export function BuyerAuthForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [serverError, setServerError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  const signInForm = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });
  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirm: "" },
  });

  async function doSignIn(email: string, password: string) {
    const result = await signIn("email-password", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
      callbackUrl,
    });
    if (!result || result.error) {
      setServerError("Email or password is incorrect.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  function onSignIn(values: SignInValues) {
    setServerError(undefined);
    startTransition(() => doSignIn(values.email, values.password));
  }

  function onRegister(values: RegisterValues) {
    setServerError(undefined);
    startTransition(async () => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email.trim().toLowerCase(),
          password: values.password,
        }),
      });
      if (res.status === 409) {
        setServerError("An account with that email already exists.");
        return;
      }
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setServerError(body.error ?? "Could not create your account.");
        return;
      }
      // Auto sign-in with the same credentials.
      await doSignIn(values.email, values.password);
    });
  }

  if (mode === "signin") {
    return (
      <form onSubmit={signInForm.handleSubmit(onSignIn)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="h-12 text-base"
            aria-invalid={!!signInForm.formState.errors.email}
            aria-describedby={
              signInForm.formState.errors.email ? "email-error" : undefined
            }
            {...signInForm.register("email")}
          />
          {signInForm.formState.errors.email && (
            <p id="email-error" className="text-xs text-destructive">
              {signInForm.formState.errors.email.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            className="h-12 text-base"
            aria-invalid={!!signInForm.formState.errors.password}
            aria-describedby={
              signInForm.formState.errors.password ? "password-error" : undefined
            }
            {...signInForm.register("password")}
          />
          {signInForm.formState.errors.password && (
            <p id="password-error" className="text-xs text-destructive">
              {signInForm.formState.errors.password.message}
            </p>
          )}
        </div>
        {serverError && (
          <p role="alert" className="text-sm text-destructive">
            {serverError}
          </p>
        )}
        <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
        <button
          type="button"
          onClick={() => {
            setMode("register");
            setServerError(undefined);
          }}
          className="rounded-sm text-xs font-medium text-accent underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          New to Shezmin? Create an account
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="reg-name">Name (optional)</Label>
        <Input
          id="reg-name"
          type="text"
          autoComplete="name"
          placeholder="Your name"
          className="h-12 text-base"
          {...registerForm.register("name")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-email">Email</Label>
        <Input
          id="reg-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          className="h-12 text-base"
          aria-invalid={!!registerForm.formState.errors.email}
          aria-describedby={
            registerForm.formState.errors.email ? "reg-email-error" : undefined
          }
          {...registerForm.register("email")}
        />
        {registerForm.formState.errors.email && (
          <p id="reg-email-error" className="text-xs text-destructive">
            {registerForm.formState.errors.email.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-password">Password</Label>
        <Input
          id="reg-password"
          type="password"
          autoComplete="new-password"
          className="h-12 text-base"
          aria-invalid={!!registerForm.formState.errors.password}
          aria-describedby={
            registerForm.formState.errors.password
              ? "reg-password-error"
              : undefined
          }
          {...registerForm.register("password")}
        />
        {registerForm.formState.errors.password && (
          <p id="reg-password-error" className="text-xs text-destructive">
            {registerForm.formState.errors.password.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-confirm">Confirm password</Label>
        <Input
          id="reg-confirm"
          type="password"
          autoComplete="new-password"
          className="h-12 text-base"
          aria-invalid={!!registerForm.formState.errors.confirm}
          aria-describedby={
            registerForm.formState.errors.confirm
              ? "reg-confirm-error"
              : undefined
          }
          {...registerForm.register("confirm")}
        />
        {registerForm.formState.errors.confirm && (
          <p id="reg-confirm-error" className="text-xs text-destructive">
            {registerForm.formState.errors.confirm.message}
          </p>
        )}
      </div>
      {serverError && (
        <p role="alert" className="text-sm text-destructive">
          {serverError}
        </p>
      )}
      <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
      <button
        type="button"
        onClick={() => {
          setMode("signin");
          setServerError(undefined);
        }}
        className="rounded-sm text-xs font-medium text-accent underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        Already have an account? Sign in
      </button>
    </form>
  );
}
