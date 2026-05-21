import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Sell on Bazaar — Reach US buyers, paid in INR",
};

export default function SellLandingPage() {
  return (
    <main className="min-h-dvh">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link href="/" className="text-base font-semibold tracking-tight">
            Bazaar
          </Link>
          <Link
            href="/sign-in?as=seller"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Sign in
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-5 py-12 md:py-20">
        <div className="max-w-2xl space-y-5">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">
            For Indian artisans &amp; small shops
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
            Sell to US buyers. Get paid in INR.
          </h1>
          <p className="text-base text-muted-foreground md:text-lg">
            Bazaar handles English listings, US payments, international shipping, and customs.
            You ship from home, we handle the rest.
          </p>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Button asChild size="lg" className="h-12 px-6 text-base">
              <Link href="/sign-in?as=seller">Start selling</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-6 text-base">
              <Link href="#how-it-works">How it works</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Phone sign-up. No credit card. Free to list.
          </p>
        </div>
      </section>

      <section id="how-it-works" className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-5xl px-5 py-12 md:py-16">
          <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            <Step
              n={1}
              title="Sign up with your phone"
              body="Verify with a one-time code. Add your shop profile and basic KYC (GST / PAN / Udyam)."
            />
            <Step
              n={2}
              title="Upload products"
              body="Snap photos and write in your language. Our AI translates, prices, and writes the listing."
            />
            <Step
              n={3}
              title="We handle the rest"
              body="US buyers pay in USD. We convert, deduct fees, and pay you in INR via Razorpay."
            />
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-12 md:py-16">
        <div className="grid gap-6 sm:grid-cols-2">
          <Feature title="No English required" body="List in Hindi, Tamil, Bengali — our AI handles translation." />
          <Feature title="Transparent fees" body="Flat marketplace fee, FX shown up-front. No hidden charges." />
          <Feature title="International shipping" body="Pre-paid labels and customs documents generated for you." />
          <Feature title="Escrow protection" body="Funds are held until the buyer confirms delivery." />
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-5 py-12 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Ready when you are.</h2>
          <p className="mt-2 text-sm text-muted-foreground">Onboarding takes about 5 minutes.</p>
          <Button asChild size="lg" className="mt-6 h-12 px-6 text-base">
            <Link href="/sign-in?as=seller">Start selling</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="space-y-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
        {n}
      </div>
      <h3 className="text-base font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground">{body}</p>
    </li>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="text-base font-medium">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
