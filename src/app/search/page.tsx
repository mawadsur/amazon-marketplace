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
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SearchPage(props: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await props.searchParams;
  const intent = q ? await parseIntent(q) : null;
  const [results, categories, regions] = await Promise.all([
    intent ? searchWithIntent(intent) : Promise.resolve([]),
    listCategories(),
    listRegions(),
  ]);
  const chips = intent ? intentChips(intent) : [];
  const activeCategory = intent?.categories[0];
  const activeRegion = intent?.regions[0];

  return (
    <>
      <MarketplaceNav initialQuery={q} />
      <main className="bg-muted/40">
        {/* Breadcrumb */}
        <div className="container mx-auto max-w-7xl px-4 py-3">
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
          <div className="container mx-auto max-w-7xl px-4 pb-3">
            <div className="flex flex-wrap items-center gap-2 rounded-sm border border-accent/30 bg-accent/5 p-3 text-sm">
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
                        "rounded-full border px-2 py-0.5 text-xs font-medium",
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
          <div className="container mx-auto max-w-7xl px-4 pb-10">
            <div className="rounded-sm border border-border bg-card p-12 text-center">
              <p className="text-base text-foreground">
                No matches for &ldquo;{q}&rdquo;.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Try different terms or{" "}
                <Link href="/shop" className="text-accent hover:underline">
                  browse by category
                </Link>
                .
              </p>
            </div>
          </div>
        ) : (
          <div className="container mx-auto max-w-7xl px-4 pb-10">
            <div className="grid gap-4 lg:grid-cols-[24%_1fr]">
              <FilterSidebar
                categories={categories.map((c) => ({
                  slug: c.slug,
                  name: c.name,
                  count: c._count.products,
                }))}
                regions={regions}
                activeCategory={activeCategory}
                activeRegion={activeRegion}
              />

              <section className="rounded-sm border border-border bg-background p-4">
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

                <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
