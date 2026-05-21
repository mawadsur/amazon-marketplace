// /search?q=... — simple ILIKE search over product title + description.
// TODO: replace with AI search-intent matching once stubs.ts gets a stub.

import { MarketplaceNav } from "@/components/buyer/marketplace-nav";
import { ProductCard } from "@/components/buyer/product-card";
import { search } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function SearchPage(props: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await props.searchParams;
  const results = q ? await search(q) : [];

  return (
    <>
      <MarketplaceNav initialQuery={q} />
      <main className="container mx-auto max-w-6xl px-4 py-10">
        <section className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Search</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {q ? <>Results for &ldquo;{q}&rdquo;</> : "Search the marketplace"}
          </h1>
          <p className="text-muted-foreground">
            {q ? `${results.length} products` : "Type in the bar above to find products."}
          </p>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
          {q && results.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No matches. Try a different keyword.
            </p>
          ) : null}
        </section>
      </main>
    </>
  );
}
