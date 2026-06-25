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
    <aside className="rounded-lg border border-border bg-card p-5 text-sm">
      <FacetGroup label="Category">
        <ul className="space-y-1">
          <li>
            <FacetLink href="/shop" active={!activeCategory}>
              Any category
            </FacetLink>
          </li>
          {categories.map((c) => (
            <li key={c.slug}>
              <FacetLink
                href={`/shop/category/${c.slug}`}
                active={activeCategory === c.slug}
                count={c.count}
              >
                {c.name}
              </FacetLink>
            </li>
          ))}
        </ul>
      </FacetGroup>

      <FacetGroup label="Region">
        <ul className="space-y-1">
          <li>
            <FacetLink href="/shop" active={!activeRegion}>
              Any region
            </FacetLink>
          </li>
          {regions.map((r) => (
            <li key={r.region}>
              <FacetLink
                href={`/shop/region/${regionNameToSlug(r.region)}`}
                active={activeRegion === r.region}
                count={r.shopCount}
              >
                {r.region}
              </FacetLink>
            </li>
          ))}
        </ul>
      </FacetGroup>

      <FacetGroup label="Price">
        <ul className="space-y-1">
          {PRICE_BANDS.map((p) => (
            <li key={p.label}>
              <FacetLink href={p.href}>{p.label}</FacetLink>
            </li>
          ))}
        </ul>
      </FacetGroup>

      <FacetGroup label="Seller quality">
        <ul className="space-y-1">
          <li>
            <FacetLink href="/search?sort=trust" active={!activeTier}>
              All sellers
            </FacetLink>
          </li>
          {TIER_FILTERS.map((t) => (
            <li key={t.tier}>
              <FacetLink
                href={`/search?tier=${t.tier}&sort=trust`}
                active={activeTier === t.tier}
              >
                {t.label}
              </FacetLink>
            </li>
          ))}
        </ul>
      </FacetGroup>
    </aside>
  );
}

// Editorial filter chip: rounded-md, hairline; active fills with primary rose.
function FacetLink({
  href,
  active = false,
  count,
  children,
}: {
  href: string;
  active?: boolean;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
        active
          ? "border-primary bg-primary font-medium text-primary-foreground"
          : "border-transparent text-foreground hover:border-border hover:bg-muted/60"
      }`}
    >
      <span>{children}</span>
      {typeof count === "number" ? (
        <span
          className={`text-xs ${active ? "text-primary-foreground/80" : "text-muted-foreground"}`}
        >
          {count}
        </span>
      ) : null}
    </Link>
  );
}

function FacetGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-border py-4 first:pt-0 last:border-b-0 last:pb-0">
      <h2 className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </h2>
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
          className="cursor-pointer rounded-md border border-border bg-card py-1.5 pl-2.5 pr-7 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
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
