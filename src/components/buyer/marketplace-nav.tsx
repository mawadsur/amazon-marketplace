import Link from "next/link";
import { MapPin, ShoppingBag, ChevronDown, Menu, User } from "lucide-react";
import { SearchBar } from "@/components/buyer/search-bar";
import { ConciergeDrawer } from "@/components/buyer/concierge-drawer";
import { CartBadge } from "@/components/buyer/cart-badge";

// Category links map to the live catalog slugs (textiles / jewelry / handicrafts)
// but wear sarees-store labels. Keeping working routes avoids 404s.
const SUB_LINKS: { href: string; label: string }[] = [
  { href: "/shop/category/textiles", label: "Sarees" },
  { href: "/search?cat=textiles", label: "Lehenga & Suits" },
  { href: "/shop/category/jewelry", label: "Jewelry" },
  { href: "/shop/category/handicrafts", label: "Accessories" },
  { href: "/search?regional=1", label: "Bridal Edit" },
  { href: "/legal/returns", label: "Sizing & Alterations" },
];

const HOVER =
  "transition-colors duration-200 hover:text-secondary";

export function MarketplaceNav({ initialQuery = "" }: { initialQuery?: string }) {
  return (
    <header className="sticky top-0 z-30 w-full">
      {/* Promo strip */}
      <div className="flex h-9 w-full items-center justify-center bg-subheader px-4 text-center text-xs font-medium uppercase tracking-[0.18em] text-background">
        Free shipping on orders over $99 · Atlanta&apos;s Indian clothing house since 2001
      </div>

      {/* Top bar */}
      <div className="flex h-[64px] w-full items-center gap-3 border-b border-border bg-card px-4 text-foreground sm:gap-4">
        {/* Wordmark */}
        <Link
          href="/"
          className="flex flex-col leading-none"
          aria-label="Mirage Sarees home"
        >
          <span className="font-display text-2xl font-semibold tracking-tight text-primary sm:text-[28px]">
            Mirage
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.32em] text-muted-foreground">
            Sarees
          </span>
        </Link>

        {/* Deliver-to pill */}
        <Link
          href="/buyer/account"
          className={`hidden h-11 cursor-pointer items-center gap-1.5 px-2 text-sm lg:flex ${HOVER}`}
        >
          <MapPin className="h-5 w-5 text-primary" aria-hidden="true" />
          <span className="flex flex-col leading-tight">
            <span className="text-[11px] text-muted-foreground">Deliver to</span>
            <span className="text-sm font-semibold">United States</span>
          </span>
        </Link>

        {/* Search */}
        <div className="min-w-0 flex-1">
          <SearchBar initialQuery={initialQuery} />
        </div>

        {/* Concierge */}
        <ConciergeDrawer />

        {/* Account */}
        <Link
          href="/sign-in"
          className={`hidden h-11 cursor-pointer flex-col justify-center px-2 text-sm leading-tight sm:flex ${HOVER}`}
        >
          <span className="text-[11px] text-muted-foreground">Hello, sign in</span>
          <span className="flex items-center gap-0.5 text-sm font-semibold">
            Account &amp; Lists
            <ChevronDown className="h-3 w-3" aria-hidden="true" />
          </span>
        </Link>

        {/* Orders */}
        <Link
          href="/buyer/orders"
          className={`hidden h-11 cursor-pointer flex-col justify-center px-2 text-sm leading-tight md:flex ${HOVER}`}
        >
          <span className="text-[11px] text-muted-foreground">Returns</span>
          <span className="text-sm font-semibold">&amp; Orders</span>
        </Link>

        {/* Account icon (mobile) */}
        <Link
          href="/sign-in"
          className={`flex h-11 w-9 cursor-pointer items-center justify-center sm:hidden ${HOVER}`}
          aria-label="Account"
        >
          <User className="h-6 w-6" aria-hidden="true" />
        </Link>

        {/* Cart */}
        <Link
          href="/cart"
          className={`flex h-11 cursor-pointer items-center gap-1.5 px-2 ${HOVER}`}
          aria-label="Shopping bag"
        >
          <span className="relative">
            <ShoppingBag className="h-7 w-7" aria-hidden="true" />
            <CartBadge />
          </span>
          <span className="hidden text-sm font-semibold lg:inline">Bag</span>
        </Link>
      </div>

      {/* Sub bar — category navigation */}
      <nav
        aria-label="Categories"
        className="flex h-11 w-full items-center gap-1 overflow-x-auto border-b border-border bg-background px-2 text-sm text-foreground"
      >
        <button
          type="button"
          className={`flex h-9 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 font-semibold uppercase tracking-wide ${HOVER}`}
          aria-label="Open all categories menu"
        >
          <Menu className="h-4 w-4" aria-hidden="true" />
          <span>Shop All</span>
        </button>
        {SUB_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`flex h-9 cursor-pointer items-center whitespace-nowrap rounded-md px-2.5 ${HOVER}`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
