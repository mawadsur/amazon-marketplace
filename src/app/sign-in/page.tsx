import { Suspense } from "react";
import Link from "next/link";
import { SignInForm } from "@/components/seller/sign-in-form";
import { BuyerAuthForm } from "@/components/buyer/buyer-auth-form";

export const metadata = { title: "Sign in — Mirage" };

export default function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ as?: string; callbackUrl?: string; next?: string }>;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center bg-background px-4">
      <Link
        href="/"
        className="mt-10 mb-6 cursor-pointer font-display text-4xl font-bold tracking-tight text-primary"
      >
        Mirage
      </Link>

      <div className="w-full max-w-sm">
        <Suspense
          fallback={
            <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">
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
      <>
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Use your email and password to sign in or create an account.
          </p>
          <div className="mt-4">
            <BuyerAuthForm callbackUrl={callbackUrl} />
          </div>
        </div>
        <div className="mt-4 text-center">
          <Link href="/sign-in?as=seller" className="amzn-link text-sm">
            Are you a seller? Sign in here
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
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
            New to Mirage?
          </span>
          <div className="flex-grow border-t border-border" aria-hidden="true" />
        </div>
        <Link
          href="/sign-in?as=buyer"
          className="mt-3 inline-flex w-full cursor-pointer items-center justify-center rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Create your Mirage account
        </Link>
      </div>
    </>
  );
}
