import { MarketplaceNav } from "@/components/buyer/marketplace-nav";
import { Skeleton } from "@/components/ui/skeleton";

export default function ShopLoading() {
  return (
    <>
      <MarketplaceNav />
      <main className="container mx-auto max-w-6xl px-4 py-10">
        <div className="space-y-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-lg border border-border bg-card/50">
              <Skeleton className="aspect-square w-full rounded-none" />
              <div className="space-y-2 p-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
