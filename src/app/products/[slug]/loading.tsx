import { MarketplaceNav } from "@/components/buyer/marketplace-nav";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductLoading() {
  return (
    <>
      <MarketplaceNav />
      <main className="container mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-2">
          <Skeleton className="aspect-square w-full" />
          <div className="space-y-4">
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-px w-full" />
            <Skeleton className="h-8 w-32" />
            <div className="space-y-2 pt-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <Skeleton className="h-12 w-40" />
          </div>
        </div>
      </main>
    </>
  );
}
