import Link from "next/link";

export default function HomePage() {
  return (
    <main className="container mx-auto max-w-5xl px-4 py-16">
      <section className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Marketplace MVP
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Authentic Indian goods, direct from the source.
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Handicrafts, textiles, and jewelry from vetted Indian shops — with AI-assisted
          listings, transparent USD pricing, and escrow protection.
        </p>
      </section>

      <section className="mt-12 grid gap-4 sm:grid-cols-3">
        <Link
          href="/sell"
          className="rounded-lg border border-border bg-card p-6 transition hover:bg-accent"
        >
          <h2 className="text-lg font-medium">Start selling</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Phone signup, AI listings, payouts to your bank.
          </p>
        </Link>
        <Link
          href="/shop"
          className="rounded-lg border border-border bg-card p-6 transition hover:bg-accent"
        >
          <h2 className="text-lg font-medium">Browse the marketplace</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Explore by category, region, or shop story.
          </p>
        </Link>
        <Link
          href="/admin"
          className="rounded-lg border border-border bg-card p-6 transition hover:bg-accent"
        >
          <h2 className="text-lg font-medium">Admin</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Approve sellers, moderate listings, resolve disputes.
          </p>
        </Link>
      </section>

      <section className="mt-12 rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">MVP status</p>
        <p className="mt-1">
          Foundation in place (Next.js, Prisma, Tailwind). Module work is tracked via
          ruflo &amp; the Claude Code task list.
        </p>
      </section>
    </main>
  );
}
