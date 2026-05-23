import { MarketplaceNav } from "@/components/buyer/marketplace-nav";
import { Skeleton } from "@/components/ui/skeleton";

export default function ShopLoading() {
  return (
    <>
      <MarketplaceNav />
      <main className="bg-muted/40">
        <div className="container mx-auto max-w-7xl px-4 py-3">
          <Skeleton className="h-3 w-32" />
        </div>
        <div className="container mx-auto max-w-7xl px-4 pb-10">
          <Skeleton className="h-7 w-64" />
          <div className="mt-4 grid gap-4 lg:grid-cols-[24%_1fr]">
            {/* Sidebar */}
            <aside className="rounded-sm border border-border bg-background p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="border-b border-border py-3 first:pt-0 last:border-b-0 last:pb-0"
                >
                  <Skeleton className="mb-2 h-4 w-24" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-3 w-36" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </aside>

            {/* Grid */}
            <section className="rounded-sm border border-border bg-background p-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-6 w-24" />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-sm border border-border bg-card p-3"
                  >
                    <Skeleton className="aspect-square w-full rounded-sm" />
                    <div className="mt-2 space-y-1.5">
                      <Skeleton className="h-3.5 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-5 w-1/3" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
