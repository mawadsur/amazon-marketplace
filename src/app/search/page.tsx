// /search?q=... — Amazon-style results: AI Concierge banner above a
// sidebar + grid layout. Claude (when ANTHROPIC_API_KEY set) parses the
// query into a structured intent; catalog filters on that.

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { MarketplaceNav } from "@/components/buyer/marketplace-nav";
import { ProductCard } from "@/components/buyer/product-card";
import {
  FilterSidebar,
  SortControl,
} from "@/components/buyer/discovery-filters";
import {
  searchWithIntent,
  listCategories,
  listRegions,
} from "@/lib/catalog";
import { parseIntent, intentChips } from "@/lib/concierge";
import { parseTierParam, minScoreForTier } from "@/lib/tiers";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SearchPage(props: {
  searchParams: Promise<{ q?: string; tier?: string; sort?: string }>;
}) {
  const { q = "", tier: tierParam, sort } = await props.searchParams;
  const activeTier = parseTierParam(tierParam);
  const minScore = activeTier ? minScoreForTier(activeTier) : 0;
  const sortMode = sort === "trust" ? "trust" : "recent";
  const hasCriteria = Boolean(q) || minScore > 0;
  const intent = hasCriteria ? await parseIntent(q) : null;
  const [results, categories, regions] = await Promise.all([
    intent
      ? searchWithIntent(intent, { minScore, sort: sortMode })
      : Promise.resolve([]),
    listCategories(),
    listRegions(),
  ]);
  const chips = intent ? intentChips(intent) : [];
  const activeCategory = intent?.categories[0];
  const activeRegion = intent?.regions[0];

  return (
    <>
      <MarketplaceNav initialQuery={q} />
      <main className="bg-background">
        {/* Breadcrumb */}
        <div className="container mx-auto max-w-7xl px-4 pt-6">
          <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
            <Link href="/" className="hover:text-accent hover:underline">
              Home
            </Link>
            <span className="px-1.5">›</span>
            <span className="text-foreground">
              {q ? <>Search results for &lsquo;{q}&rsquo;</> : "Search"}
            </span>
          </nav>
        </div>

        {/* AI Concierge banner */}
        {q ? (
          <div className="container mx-auto max-w-7xl px-4 pt-4 pb-3">
            <div className="flex flex-wrap items-center gap-2 rounded-md bg-accent/5 p-4 text-sm ring-1 ring-accent/30">
              <span className="flex items-center gap-1.5 font-medium text-accent">
                <Sparkles className="h-4 w-4" aria-hidden />
                {intent?.aiAssisted ? "AI search" : "Search"}
              </span>
              <span className="text-foreground">&ldquo;{q}&rdquo;</span>
              {chips.length > 0 ? (
                <>
                  <span className="text-xs text-muted-foreground">
                    Understood:
                  </span>
                  {chips.map((c, i) => (
                    <span
                      key={`${c.label}-${i}`}
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                        c.tone,
                      )}
                    >
                      {c.label}
                    </span>
                  ))}
                </>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Empty state */}
        {q && results.length === 0 ? (
          <div className="container mx-auto max-w-7xl px-4 pt-4 pb-14">
            <div className="rounded-lg border border-border bg-card p-14 text-center">
              <p className="font-display text-2xl font-bold tracking-tight text-foreground">
                No matches for &ldquo;{q}&rdquo;.
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Try different terms or{" "}
                <Link href="/shop" className="text-accent hover:underline">
                  browse by category
                </Link>
                .
              </p>
            </div>
          </div>
        ) : (
          <div className="container mx-auto max-w-7xl px-4 pt-4 pb-14">
            <div className="grid gap-6 lg:grid-cols-[24%_1fr]">
              <FilterSidebar
                categories={categories.map((c) => ({
                  slug: c.slug,
                  name: c.name,
                  count: c._count.products,
                }))}
                regions={regions}
                activeCategory={activeCategory}
                activeRegion={activeRegion}
                activeTier={activeTier ? activeTier.toLowerCase() : undefined}
              />

              <section className="rounded-lg border border-border bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                  <p className="text-sm">
                    {q ? (
                      <>
                        <span className="text-muted-foreground">
                          1-{results.length} of{" "}
                        </span>
                        <span className="font-medium">{results.length}</span>{" "}
                        <span className="text-muted-foreground">
                          results for
                        </span>{" "}
                        <span className="text-destructive">
                          &ldquo;{q}&rdquo;
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">
                        Try: &ldquo;handwoven silk saree from Tamil Nadu under
                        $100&rdquo;
                      </span>
                    )}
                  </p>
                  <SortControl />
                </div>

                <div className="mt-5 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
                  {results.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>

                {results.length > 0 ? (
                  <footer className="mt-6 border-t border-border pt-4 text-center text-xs text-muted-foreground">
                    Page 1 of 1
                  </footer>
                ) : null}
              </section>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
