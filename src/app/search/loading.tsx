import { MarketplaceNav } from "@/components/buyer/marketplace-nav";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingDots } from "@/components/motion";

export default function SearchLoading() {
  return (
    <>
      <MarketplaceNav />
      <main className="container mx-auto max-w-6xl px-4 py-10">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wide text-primary">AI Concierge</p>
          <Skeleton className="h-9 w-64" />
          <div className="flex items-center gap-2 pt-1">
            <span className="text-sm text-muted-foreground">Understanding your query</span>
            <LoadingDots />
          </div>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
