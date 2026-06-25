// /about/story — Shezmin brand narrative. Public, no DB.

import Link from "next/link";
import { MarketplaceNav } from "@/components/buyer/marketplace-nav";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Our Story · Shezmin",
  description:
    "How Shezmin began — an online clothing brand bringing India's boutique craftsmanship to your door, with curation over clutter and the people behind the looms at the heart of it.",
};

export default function OurStoryPage() {
  return (
    <>
      <MarketplaceNav />
      <main className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-4xl font-semibold tracking-tight">
          Our Story
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Curation over clutter. Craft over commodity.
        </p>

        <section className="prose prose-sm mt-8 space-y-6 text-sm leading-relaxed text-foreground">
          <div>
            <p>
              Shezmin started with a familiar ache: wanting clothes that
              actually feel like home, no matter where you open your laptop. The
              sari you&apos;d find tucked in a lane in Jaipur. The lehenga a
              family boutique in Hyderabad would make just for you. The pieces
              that carry a place in their weave — and that almost never make it
              across an ocean.
            </p>
          </div>

          <div>
            <p>
              So we set out to shorten the distance. Not by flattening India&apos;s
              craft into a catalog, but by walking into the boutiques ourselves —
              meeting the people, seeing the work, and bringing only what we&apos;d
              be proud to wear to anyone, anywhere.
            </p>
          </div>

          <blockquote className="font-display text-2xl font-semibold leading-snug text-primary">
            &ldquo;We didn&apos;t want a thousand storefronts. We wanted the right
            hundred — and the makers behind them, made visible.&rdquo;
          </blockquote>

          <div>
            <p>
              Behind every listing is a loom, a workshop, a family that has done
              this for generations. We believe the people who make the cloth
              deserve to be seen, paid fairly, and connected directly to the
              people who&apos;ll cherish their work — which is why our pricing is
              flat and transparent, and our sellers are vetted, never anonymous.
            </p>
          </div>

          <div>
            <p>
              Shezmin is still young, and still choosing carefully. Every
              boutique we add, every piece we list, we ask the same question:
              would we send this to someone we love? If the answer is yes, it
              earns its place here.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <p className="text-muted-foreground">
              Learn more{" "}
              <Link href="/about" className="amzn-link">
                about Shezmin
              </Link>
              , or if you run a boutique that belongs here,{" "}
              <Link href="/seller" className="amzn-link">
                sell with us
              </Link>
              .
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
