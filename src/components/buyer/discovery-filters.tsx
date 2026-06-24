// Amazon-style discovery filter sidebar + sort control. Shared by /shop,
// /shop/category/[slug], /shop/region/[slug], and /search. Server-renderable.

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { regionNameToSlug } from "@/lib/catalog";

const PRICE_BANDS: Array<{ label: string; href: string }> = [
  { label: "Under $25", href: "/search?q=under+%2425" },
  { label: "$25 to $50", href: "/search?q=%2425+to+%2450" },
  { label: "$50 to $100", href: "/search?q=%2450+to+%24100" },
  { label: "$100 to $200", href: "/search?q=%24100+to+%24200" },
  { label: "Over $200", href: "/search?q=over+%24200" },
];

const TIER_FILTERS: Array<{ tier: string; label: string }> = [
  { tier: "vip", label: "A+ VIP only" },
  { tier: "aplus", label: "A+ and above" },
  { tier: "bplus", label: "B+ and above" },
];

export function FilterSidebar({
  categories,
  regions,
  activeCategory,
  activeRegion,
  activeTier,
}: {
  categories: Array<{ slug: string; name: string; count: number }>;
  regions: Array<{ region: string; shopCount: number }>;
  activeCategory?: string;
  activeRegion?: string;
  activeTier?: string;
}) {
  return (
    <aside className="rounded-sm border border-border bg-background p-4 text-sm">
      <FacetGroup label="Category">
        <ul className="space-y-1.5">
          <li>
            <Link
              href="/shop"
              className={`block py-0.5 transition-colors hover:text-accent hover:underline ${
                !activeCategory ? "font-bold text-foreground" : "text-foreground"
              }`}
            >
              Any category
            </Link>
          </li>
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/shop/category/${c.slug}`}
                className={`block py-0.5 transition-colors hover:text-accent hover:underline ${
                  activeCategory === c.slug ? "font-bold text-foreground" : "text-foreground"
                }`}
              >
                {c.name}{" "}
                <span className="text-xs text-muted-foreground">({c.count})</span>
              </Link>
            </li>
          ))}
        </ul>
      </FacetGroup>

      <FacetGroup label="Region">
        <ul className="space-y-1.5">
          <li>
            <Link
              href="/shop"
              className={`block py-0.5 transition-colors hover:text-accent hover:underline ${
                !activeRegion ? "font-bold text-foreground" : "text-foreground"
              }`}
            >
              Any region
            </Link>
          </li>
          {regions.map((r) => (
            <li key={r.region}>
              <Link
                href={`/shop/region/${regionNameToSlug(r.region)}`}
                className={`block py-0.5 transition-colors hover:text-accent hover:underline ${
                  activeRegion === r.region
                    ? "font-bold text-foreground"
                    : "text-foreground"
                }`}
              >
                {r.region}{" "}
                <span className="text-xs text-muted-foreground">({r.shopCount})</span>
              </Link>
            </li>
          ))}
        </ul>
      </FacetGroup>

      <FacetGroup label="Price">
        <ul className="space-y-1.5">
          {PRICE_BANDS.map((p) => (
            <li key={p.label}>
              <Link
                href={p.href}
                className="block py-0.5 text-foreground transition-colors hover:text-accent hover:underline"
              >
                {p.label}
              </Link>
            </li>
          ))}
        </ul>
      </FacetGroup>

      <FacetGroup label="Seller quality">
        <ul className="space-y-1.5">
          <li>
            <Link
              href="/search?sort=trust"
              className={`block py-0.5 transition-colors hover:text-accent hover:underline ${
                !activeTier ? "font-bold text-foreground" : "text-foreground"
              }`}
            >
              All sellers
            </Link>
          </li>
          {TIER_FILTERS.map((t) => (
            <li key={t.tier}>
              <Link
                href={`/search?tier=${t.tier}&sort=trust`}
                className={`block py-0.5 transition-colors hover:text-accent hover:underline ${
                  activeTier === t.tier ? "font-bold text-foreground" : "text-foreground"
                }`}
              >
                {t.label}
              </Link>
            </li>
          ))}
        </ul>
      </FacetGroup>
    </aside>
  );
}

function FacetGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-border py-3 first:pt-0 last:border-b-0 last:pb-0">
      <h2 className="mb-2 text-sm font-bold text-foreground">{label}</h2>
      {children}
    </section>
  );
}

export function SortControl() {
  return (
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
      <span>Sort by</span>
      <span className="relative">
        <select
          aria-label="Sort results"
          className="cursor-pointer rounded-sm border border-border bg-background py-1 pl-2 pr-7 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
          defaultValue="featured"
        >
          <option value="featured">Featured</option>
          <option value="newest">Newest</option>
          <option value="price-low">Price: low to high</option>
          <option value="price-high">Price: high to low</option>
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
      </span>
    </label>
  );
}
