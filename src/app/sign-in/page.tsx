import { Suspense } from "react";
import Link from "next/link";
import { SignInForm } from "@/components/seller/sign-in-form";

export const metadata = { title: "Sign in — Bazaar" };

export default function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ as?: string; callbackUrl?: string }>;
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-10">
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
        ← Home
      </Link>

      <div className="mt-8">
        <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
          <SignInResolver searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function SignInResolver({
  searchParams,
}: {
  searchParams: Promise<{ as?: string; callbackUrl?: string }>;
}) {
  const sp = await searchParams;
  const as = sp.as === "buyer" ? "buyer" : "seller";
  const callbackUrl = sp.callbackUrl ?? (as === "seller" ? "/seller" : "/");

  if (as === "buyer") {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Buyer sign-in</h1>
        <p className="text-sm text-muted-foreground">
          Buyer accounts use email and password. The buyer experience is being built —
          check back soon.
        </p>
        <Link
          href="/sign-in?as=seller"
          className="inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Sign in as a seller instead →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in to sell</h1>
        <p className="text-sm text-muted-foreground">
          Enter your phone number — we&apos;ll text you a 6-digit code.
        </p>
      </header>
      <SignInForm callbackUrl={callbackUrl} />
    </div>
  );
}
