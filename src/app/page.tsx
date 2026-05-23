import Link from "next/link";
import { ArrowRight, Shield, Sparkles, Truck } from "lucide-react";
import { MarketplaceNav } from "@/components/buyer/marketplace-nav";
import { AiSearchHero } from "@/components/marketplace/ai-search-hero";
import { Reveal, StaggerGrid, StaggerItem, HoverLift } from "@/components/motion";

// MarketplaceNav uses useSearchParams (via SearchBar) so this page can't be
// statically prerendered without a Suspense boundary. Force-dynamic is the
// right call for a marketplace home anyway — the surface is interactive.
export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      <MarketplaceNav />
      <main>
        <AiSearchHero />

        {/* Category tiles */}
        <section className="container mx-auto max-w-6xl px-4 py-16">
          <Reveal className="mb-10 text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-primary">
              Curated categories
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Three crafts, hand-picked
            </h2>
          </Reveal>

          <StaggerGrid className="grid gap-4 sm:grid-cols-3">
            {[
              {
                slug: "textiles",
                title: "Textiles",
                line: "Silk, cotton, block-print, kantha",
                accent: "from-amber-500/20 to-orange-600/10",
              },
              {
                slug: "jewelry",
                title: "Jewelry",
                line: "Meenakari, kundan, silver, gold",
                accent: "from-yellow-500/20 to-rose-500/10",
              },
              {
                slug: "handicrafts",
                title: "Handicrafts",
                line: "Pottery, carving, brassware, wood",
                accent: "from-emerald-500/15 to-teal-500/10",
              },
            ].map((c) => (
              <StaggerItem key={c.slug}>
                <HoverLift>
                  <Link
                    href={`/shop/category/${c.slug}`}
                    className={`group relative block overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${c.accent} p-8 transition-colors hover:border-primary/40`}
                  >
                    <h3 className="font-display text-3xl font-semibold tracking-tight">
                      {c.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">{c.line}</p>
                    <div className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-primary opacity-90 transition-opacity group-hover:opacity-100">
                      Browse
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                    </div>
                  </Link>
                </HoverLift>
              </StaggerItem>
            ))}
          </StaggerGrid>
        </section>

        {/* Trust strip */}
        <section className="border-y border-border bg-card/30">
          <div className="container mx-auto max-w-6xl px-4 py-12">
            <StaggerGrid className="grid gap-8 md:grid-cols-3">
              {[
                {
                  icon: Sparkles,
                  title: "AI-assisted listings",
                  body: "Sellers upload one photo; AI generates the product page with descriptions in US English, market-aware pricing, and category tags.",
                },
                {
                  icon: Shield,
                  title: "Trust Engine",
                  body: "Every shop earns a real-time Authenticity Score from KYC, reviews, dispute rate, and tenure. Buyer Protection auto-covers each paid order.",
                },
                {
                  icon: Truck,
                  title: "Landed cost, no surprises",
                  body: "At checkout you see item + shipping + US import duty + service fee. Duty is prepaid (DDP). No surprise charges at delivery.",
                },
              ].map((f) => (
                <StaggerItem key={f.title} className="flex gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
                    <f.icon className="h-5 w-5" aria-hidden />
                  </div>
                  <div>
                    <h3 className="font-medium">{f.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {f.body}
                    </p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerGrid>
          </div>
        </section>

        {/* Footer CTAs */}
        <section className="container mx-auto max-w-6xl px-4 py-20">
          <Reveal className="grid gap-4 md:grid-cols-2">
            <Link
              href="/shop"
              className="group glass relative overflow-hidden rounded-2xl p-8 transition-colors hover:border-primary/40"
            >
              <h3 className="font-display text-2xl font-semibold">Browse the marketplace</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Explore by category, region, or shop story.
              </p>
              <div className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-primary">
                Start browsing
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </div>
            </Link>
            <Link
              href="/sell"
              className="group glass relative overflow-hidden rounded-2xl p-8 transition-colors hover:border-primary/40"
            >
              <h3 className="font-display text-2xl font-semibold">Sell on Bazaar</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Mobile signup. AI builds your listings. Direct USD payouts to your bank.
              </p>
              <div className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-primary">
                Start selling
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </div>
            </Link>
          </Reveal>
        </section>
      </main>
    </>
  );
}
