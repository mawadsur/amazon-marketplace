import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { SellerNav } from "@/components/seller/seller-nav";

export const dynamic = "force-dynamic";

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in?as=seller&callbackUrl=/seller");
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur md:hidden">
        <Link href="/seller" className="text-base font-semibold tracking-tight">
          Shezmin Seller
        </Link>
        <SellerNav variant="mobile" />
      </header>

      <div className="flex">
        <aside className="hidden w-60 shrink-0 border-r border-border md:block">
          <div className="sticky top-0 flex h-dvh flex-col px-4 py-6">
            <Link href="/seller" className="text-lg font-semibold tracking-tight">
              Shezmin Seller
            </Link>
            <div className="mt-8 flex-1">
              <SellerNav variant="desktop" />
            </div>
            <Link
              href="/"
              className="text-xs text-muted-foreground transition hover:text-foreground"
            >
              ← Back to marketplace
            </Link>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-10">{children}</main>
      </div>
    </div>
  );
}
