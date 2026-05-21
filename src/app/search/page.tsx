// /search?q=... — AI Shopping Concierge.
// Claude (when ANTHROPIC_API_KEY set) parses the query into a structured
// intent — categories, regions, price band, keywords, gift context — and the
// catalog filters on those instead of doing a flat ILIKE.

import { MarketplaceNav } from "@/components/buyer/marketplace-nav";
import { ProductCard } from "@/components/buyer/product-card";
import { searchWithIntent } from "@/lib/catalog";
import { parseIntent, intentChips } from "@/lib/concierge";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SearchPage(props: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await props.searchParams;
  const intent = q ? await parseIntent(q) : null;
  const results = intent ? await searchWithIntent(intent) : [];
  const chips = intent ? intentChips(intent) : [];

  return (
    <>
      <MarketplaceNav initialQuery={q} />
      <main className="container mx-auto max-w-6xl px-4 py-10">
        <section className="space-y-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {intent?.aiAssisted ? "AI Concierge" : "Search"}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {q ? <>Results for &ldquo;{q}&rdquo;</> : "Search the marketplace"}
          </h1>
          {chips.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-muted-foreground">Understood:</span>
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
            </div>
          ) : null}
          <p className="text-muted-foreground">
            {q
              ? `${results.length} ${results.length === 1 ? "product" : "products"}`
              : "Try: “handwoven silk saree from Tamil Nadu under $100”"}
          </p>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
          {q && results.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No matches. Try removing filters from your query or browse by{" "}
              <a className="underline" href="/shop">
                category
              </a>
              .
            </p>
          ) : null}
        </section>
      </main>
    </>
  );
}
