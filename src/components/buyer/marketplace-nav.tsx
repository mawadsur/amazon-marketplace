import Link from "next/link";
import {
  MapPin,
  ShoppingCart,
  ChevronDown,
  Menu,
} from "lucide-react";
import { SearchBar } from "@/components/buyer/search-bar";

const SUB_LINKS: { href: string; label: string }[] = [
  { href: "/search?deals=1", label: "Today's Deals" },
  { href: "/search?cat=handicrafts", label: "Handicrafts" },
  { href: "/search?cat=textiles", label: "Textiles" },
  { href: "/search?cat=jewelry", label: "Jewelry" },
  { href: "/search?regional=1", label: "Regional Picks" },
  { href: "/seller", label: "Sell on Bazaar" },
  { href: "/legal/returns", label: "Customer Service" },
];

const HOVER_BORDER =
  "border border-transparent hover:border-white transition-colors duration-200";

export function MarketplaceNav({ initialQuery = "" }: { initialQuery?: string }) {
  return (
    <header className="sticky top-0 z-30 w-full">
      {/* Top bar */}
      <div className="flex h-[60px] w-full items-center gap-2 bg-header px-4 text-white">
        {/* Wordmark */}
        <Link
          href="/"
          className={`flex h-11 cursor-pointer items-center rounded-sm px-2 text-xl font-bold tracking-tight ${HOVER_BORDER}`}
          aria-label="Bazaar home"
        >
          Bazaar
        </Link>

        {/* Deliver-to pill */}
        <Link
          href="/buyer/account"
          className={`hidden h-11 cursor-pointer items-center gap-1 rounded-sm px-2 lg:flex ${HOVER_BORDER}`}
        >
          <MapPin className="h-5 w-5" aria-hidden="true" />
          <div className="flex flex-col leading-tight">
            <span className="text-xs text-white/70">Deliver to</span>
            <span className="text-sm font-bold">United States</span>
          </div>
        </Link>

        {/* Search */}
        <div className="min-w-0 flex-1">
          <SearchBar initialQuery={initialQuery} />
        </div>

        {/* Language */}
        <button
          type="button"
          className={`hidden h-11 cursor-pointer items-center gap-1 rounded-sm px-2 text-sm font-bold md:flex ${HOVER_BORDER}`}
          aria-label="Language: English"
        >
          <span>EN</span>
          <ChevronDown className="h-3 w-3" aria-hidden="true" />
        </button>

        {/* Account */}
        <Link
          href="/sign-in"
          className={`hidden h-11 cursor-pointer flex-col justify-center rounded-sm px-2 leading-tight sm:flex ${HOVER_BORDER}`}
        >
          <span className="text-xs">Hello, sign in</span>
          <span className="flex items-center gap-0.5 text-sm font-bold">
            Account &amp; Lists
            <ChevronDown className="h-3 w-3" aria-hidden="true" />
          </span>
        </Link>

        {/* Orders */}
        <Link
          href="/buyer/orders"
          className={`hidden h-11 cursor-pointer flex-col justify-center rounded-sm px-2 leading-tight md:flex ${HOVER_BORDER}`}
        >
          <span className="text-xs">Returns</span>
          <span className="text-sm font-bold">&amp; Orders</span>
        </Link>

        {/* Cart */}
        <Link
          href="/cart"
          className={`flex h-11 cursor-pointer items-end gap-1 rounded-sm px-2 ${HOVER_BORDER}`}
          aria-label="Cart"
        >
          <div className="relative">
            <ShoppingCart className="h-8 w-8" aria-hidden="true" />
            <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-secondary px-1 text-center text-xs font-bold text-secondary-foreground">
              0
            </span>
          </div>
          <span className="hidden text-sm font-bold lg:inline">Cart</span>
        </Link>
      </div>

      {/* Sub bar */}
      <nav
        aria-label="Categories"
        className="flex h-10 w-full items-center gap-1 overflow-x-auto bg-subheader px-2 text-sm text-white"
      >
        <button
          type="button"
          className={`flex h-9 cursor-pointer items-center gap-1 whitespace-nowrap rounded-sm px-2 font-bold ${HOVER_BORDER}`}
          aria-label="Open all categories menu"
        >
          <Menu className="h-4 w-4" aria-hidden="true" />
          <span>All</span>
        </button>
        {SUB_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`flex h-9 cursor-pointer items-center whitespace-nowrap rounded-sm px-2 ${HOVER_BORDER}`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
