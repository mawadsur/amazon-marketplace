import Link from "next/link";
import { SearchBar } from "@/components/buyer/search-bar";

export function MarketplaceNav({ initialQuery = "" }: { initialQuery?: string }) {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-border/40 bg-background/70 backdrop-blur-xl backdrop-saturate-150">
      <div className="container mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3.5">
        <Link
          href="/"
          className="font-display text-xl font-semibold tracking-tight transition-colors hover:text-primary"
        >
          Bazaar
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {[
            { href: "/shop", label: "Browse" },
            { href: "/wishlist", label: "Wishlist" },
            { href: "/cart", label: "Cart" },
            { href: "/buyer/account", label: "Account" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto w-full sm:w-auto sm:flex-1 sm:max-w-md">
          <SearchBar initialQuery={initialQuery} />
        </div>
      </div>
    </header>
  );
}
