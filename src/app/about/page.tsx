// /about — about Shezmin. Public, no DB.

import Link from "next/link";
import { MarketplaceNav } from "@/components/buyer/marketplace-nav";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "About · Shezmin",
  description:
    "Shezmin is a curated online clothing brand delivering apparel direct from India's finest boutiques — try-on previews, transparent pricing, and a return guarantee.",
};

export default function AboutPage() {
  return (
    <>
      <MarketplaceNav />
      <main className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-4xl font-semibold tracking-tight">
          About Shezmin
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          India&apos;s finest boutiques, delivered to your door.
        </p>

        <section className="prose prose-sm mt-8 space-y-6 text-sm leading-relaxed text-foreground">
          <div>
            <p>
              Shezmin is a curated online clothing brand. We deliver apparel
              direct from India&apos;s finest boutiques — wherever you are. From
              handwoven sarees and bridal lehengas to suits, jewelry, and
              everyday accessories, every piece comes from a maker we know and a
              boutique we trust.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Quality-vetted sellers</h2>
            <p className="mt-2">
              We don&apos;t list everything — we list the right things. Each
              boutique on Shezmin is reviewed for craftsmanship, authenticity,
              and service before it ever reaches you. Curation over clutter is
              the whole point.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Transparent pricing</h2>
            <p className="mt-2">
              Sellers set their prices; we add a flat{" "}
              <strong>10% service charge</strong> at checkout and nothing more.
              No hidden markup on the garment, no surprise fees — just an honest
              line item that keeps the marketplace running and buyers protected.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Try-on previews</h2>
            <p className="mt-2">
              Buying clothing online shouldn&apos;t be a guess. Our AI-powered
              try-on previews let you picture how a piece looks before it ships,
              so you can shop with confidence from anywhere.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">A return guarantee</h2>
            <p className="mt-2">
              If something isn&apos;t right, our buyer protection and{" "}
              <Link href="/legal/returns" className="amzn-link">
                return guarantee
              </Link>{" "}
              have you covered. We stand behind every order on the platform.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <p className="font-semibold">Want to know how Shezmin began?</p>
            <p className="mt-2 text-muted-foreground">
              Read{" "}
              <Link href="/about/story" className="amzn-link">
                our story
              </Link>{" "}
              — the people, the looms, and the idea behind the marketplace. Run a
              boutique?{" "}
              <Link href="/seller" className="amzn-link">
                Sell with us
              </Link>
              .
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
