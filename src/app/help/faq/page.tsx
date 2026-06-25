// /help/faq — frequently asked questions. Public, no DB.

import Link from "next/link";
import { MarketplaceNav } from "@/components/buyer/marketplace-nav";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "FAQ · Shezmin",
  description:
    "Answers to common questions about Shezmin — shipping and duties, the flat 10% service charge, returns, sizing, try-on previews, tracking orders, selling, and payment methods.",
};

export default function FaqPage() {
  return (
    <>
      <MarketplaceNav />
      <main className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-4xl font-semibold tracking-tight">
          Frequently asked questions
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Everything you need to shop Shezmin with confidence.
        </p>

        <section className="prose prose-sm mt-8 space-y-6 text-sm leading-relaxed text-foreground">
          <div>
            <h3 className="font-semibold">
              How long does shipping take, and what about duties?
            </h3>
            <p className="mt-2">
              Most orders ship from India and arrive within 7–14 business days,
              depending on your location and the boutique&apos;s fulfilment time.
              Shipping is <strong>free on orders over $99</strong>, and import
              duties are prepaid at checkout — so there are no surprise fees on
              delivery.
            </p>
          </div>

          <div>
            <h3 className="font-semibold">What is the 10% service charge?</h3>
            <p className="mt-2">
              Sellers set their own item prices, and Shezmin adds a transparent,
              flat <strong>10% service charge</strong> at checkout. There&apos;s
              no hidden markup on the garment — this single fee supports curation,
              buyer protection, and dispute handling.
            </p>
          </div>

          <div>
            <h3 className="font-semibold">How do returns and refunds work?</h3>
            <p className="mt-2">
              You can request a return within 14 days of delivery for items in
              their original condition. Refunds are issued once the seller
              confirms receipt. See our full{" "}
              <Link href="/legal/returns" className="amzn-link">
                Returns &amp; refunds
              </Link>{" "}
              policy for timelines and what can&apos;t be returned.
            </p>
          </div>

          <div>
            <h3 className="font-semibold">
              What about sizing and alterations?
            </h3>
            <p className="mt-2">
              Each listing includes a size guide and measurements from the
              boutique. Many sellers offer made-to-measure and alteration options
              — look for these on the product page, and reach out to the boutique
              with any questions before ordering. Made-to-order pieces follow
              special return rules.
            </p>
          </div>

          <div>
            <h3 className="font-semibold">How do try-on previews work?</h3>
            <p className="mt-2">
              On supported listings, our AI-powered try-on lets you preview how a
              piece looks before you buy. It&apos;s a visual aid to help you shop
              across borders with confidence — not a guarantee of exact fit, so
              always check the size guide too.
            </p>
          </div>

          <div>
            <h3 className="font-semibold">How do I track my order?</h3>
            <p className="mt-2">
              Once your order ships, you&apos;ll get tracking details by email,
              and you can follow every order from{" "}
              <Link href="/buyer/orders" className="amzn-link">
                your orders
              </Link>
              , including cross-border updates.
            </p>
          </div>

          <div>
            <h3 className="font-semibold">How do I sell on Shezmin?</h3>
            <p className="mt-2">
              Shezmin works with quality-vetted boutiques across India. If you run
              one, head to the{" "}
              <Link href="/seller" className="amzn-link">
                seller portal
              </Link>{" "}
              to apply and learn how listings, pricing, and payouts work.
            </p>
          </div>

          <div>
            <h3 className="font-semibold">What payment methods do you accept?</h3>
            <p className="mt-2">
              We accept major credit and debit cards, processed securely through
              our payment provider. Shezmin never stores your full card number, and
              your order total — including the service charge and prepaid duties —
              is shown clearly before you confirm.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
