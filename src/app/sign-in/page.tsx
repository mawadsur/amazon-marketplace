import { Suspense } from "react";
import Link from "next/link";
import { SignInForm } from "@/components/seller/sign-in-form";

export const metadata = { title: "Sign in — Bazaar" };

export default function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ as?: string; callbackUrl?: string; next?: string }>;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center bg-background px-4">
      <Link
        href="/"
        className="mt-8 mb-4 cursor-pointer text-3xl font-bold tracking-tight text-foreground"
      >
        Bazaar
      </Link>

      <div className="w-full max-w-sm">
        <Suspense
          fallback={
            <div className="rounded-sm border border-border bg-card p-6 text-sm text-muted-foreground">
              Loading…
            </div>
          }
        >
          <SignInResolver searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function SignInResolver({
  searchParams,
}: {
  searchParams: Promise<{ as?: string; callbackUrl?: string; next?: string }>;
}) {
  const sp = await searchParams;
  const as = sp.as === "buyer" ? "buyer" : "seller";
  const callbackUrl =
    sp.callbackUrl ?? sp.next ?? (as === "seller" ? "/seller" : "/");

  if (as === "buyer") {
    return (
      <div className="rounded-sm border border-border bg-card p-6">
        <h1 className="text-xl font-medium text-foreground">Sign-In</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Buyer accounts use email and password. The buyer experience is being
          built — check back soon.
        </p>
        <Link
          href="/sign-in?as=seller"
          className="amzn-link mt-3 inline-block text-sm"
        >
          Sign in as a seller instead
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-sm border border-border bg-card p-6">
        <h1 className="text-xl font-medium text-foreground">Sign-In</h1>
        <p className="mt-2 text-xs text-muted-foreground">
          Enter your phone number — we&apos;ll text you a 6-digit code.
        </p>
        <div className="mt-4">
          <SignInForm callbackUrl={callbackUrl} />
        </div>
      </div>

      <div className="mt-6">
        <div className="relative flex items-center">
          <div className="flex-grow border-t border-border" aria-hidden="true" />
          <span className="px-3 text-xs text-muted-foreground">
            New to Bazaar?
          </span>
          <div className="flex-grow border-t border-border" aria-hidden="true" />
        </div>
        <Link
          href="/sign-up"
          className="mt-3 inline-flex w-full cursor-pointer items-center justify-center rounded-sm border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-muted"
        >
          Create your Bazaar account
        </Link>
      </div>
    </>
  );
}
