import Link from "next/link";
import { SearchBar } from "@/components/buyer/search-bar";

export function MarketplaceNav({ initialQuery = "" }: { initialQuery?: string }) {
  return (
    <header className="border-b">
      <div className="container mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Bazaar
        </Link>
        <nav className="flex items-center gap-3 text-sm text-muted-foreground">
          <Link href="/shop" className="hover:text-foreground">
            Browse
          </Link>
          <Link href="/wishlist" className="hover:text-foreground">
            Wishlist
          </Link>
          <Link href="/cart" className="hover:text-foreground">
            Cart
          </Link>
          <Link href="/buyer/account" className="hover:text-foreground">
            Account
          </Link>
        </nav>
        <div className="ml-auto w-full sm:w-auto sm:flex-1 sm:max-w-md">
          <SearchBar initialQuery={initialQuery} />
        </div>
      </div>
    </header>
  );
}
