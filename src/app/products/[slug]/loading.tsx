import { MarketplaceNav } from "@/components/buyer/marketplace-nav";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductLoading() {
  return (
    <>
      <MarketplaceNav />
      <main className="bg-background pb-12">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <Skeleton className="h-3 w-64" />

          <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[40%_36%_22%]">
            {/* Gallery */}
            <div className="flex gap-3">
              <div className="hidden flex-col gap-2 lg:flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-12 rounded-sm" />
                ))}
              </div>
              <Skeleton className="aspect-square flex-1 rounded-md" />
            </div>

            {/* Details */}
            <div className="space-y-3">
              <Skeleton className="h-7 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-px w-full" />
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-px w-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>

            {/* Buy box */}
            <div className="space-y-3 rounded-sm border border-border bg-card p-4">
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full rounded-full" />
              <Skeleton className="h-9 w-full rounded-full" />
              <div className="space-y-1.5 border-t border-border pt-3">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          </div>

          <div className="mt-12 space-y-4 border-t border-border pt-8">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-5 w-64" />
            <Skeleton className="h-24 w-full rounded-md" />
          </div>
        </div>
      </main>
    </>
  );
}
