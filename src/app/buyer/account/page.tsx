// /buyer/account — buyer profile + orders list (orders are empty until Module 4).

import { redirect } from "next/navigation";
import Link from "next/link";
import { MarketplaceNav } from "@/components/buyer/marketplace-nav";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatUsd } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function BuyerAccountPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/sign-in?next=${encodeURIComponent("/buyer/account")}`);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      phone: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  const orders = await prisma.order.findMany({
    where: { buyerId: session.user.id },
    orderBy: { placedAt: "desc" },
    take: 20,
    select: {
      id: true,
      status: true,
      totalUsdCents: true,
      placedAt: true,
    },
  });

  return (
    <>
      <MarketplaceNav />
      <main className="container mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Your account</h1>

        <section className="mt-8 rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold">Profile</h2>
          <dl className="mt-3 grid grid-cols-1 gap-y-2 text-sm sm:grid-cols-2">
            <dt className="text-muted-foreground">Name</dt>
            <dd>{user?.name ?? "—"}</dd>
            <dt className="text-muted-foreground">Email</dt>
            <dd>{user?.email ?? "—"}</dd>
            <dt className="text-muted-foreground">Phone</dt>
            <dd>{user?.phone ?? "—"}</dd>
            <dt className="text-muted-foreground">Role</dt>
            <dd>{user?.role}</dd>
            <dt className="text-muted-foreground">Member since</dt>
            <dd>
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
            </dd>
          </dl>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold">Orders</h2>
          {orders.length === 0 ? (
            <div className="rounded-lg border p-6 text-sm text-muted-foreground">
              You don&apos;t have any orders yet.{" "}
              <Link href="/shop" className="underline">
                Start browsing
              </Link>
              .
            </div>
          ) : (
            <ul className="space-y-2">
              {orders.map((o) => (
                <li key={o.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="text-sm font-medium">Order #{o.id.slice(-8)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(o.placedAt).toLocaleDateString()} · {o.status}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">{formatUsd(o.totalUsdCents)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-8 flex gap-3">
          <Link href="/cart" className="text-sm underline">
            View cart
          </Link>
          <Link href="/wishlist" className="text-sm underline">
            View wishlist
          </Link>
        </section>
      </main>
    </>
  );
}
