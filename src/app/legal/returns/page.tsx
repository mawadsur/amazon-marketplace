// /legal/returns — static return & refund policy. Public, no DB.

import Link from "next/link";
import { MarketplaceNav } from "@/components/buyer/marketplace-nav";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Returns & refunds · Bazaar",
  description:
    "Bazaar's return policy: 14-day return window, refund timelines, and how disputes work.",
};

export default function ReturnsPolicyPage() {
  return (
    <>
      <MarketplaceNav />
      <main className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">
          Returns &amp; refunds
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: January 2026
        </p>

        <section className="prose prose-sm mt-8 space-y-6 text-sm leading-relaxed text-foreground">
          <div>
            <h2 className="text-lg font-semibold">14-day return window</h2>
            <p className="mt-2">
              You may request a return within <strong>14 days</strong> of the
              order being marked as delivered. Items must be in their original
              condition, unused, and (where applicable) in their original
              packaging.
            </p>
            <p className="mt-2">
              Custom-made, made-to-order, or personalized items are not
              returnable except in cases of damage, defect, or seller fault.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Who pays return shipping</h2>
            <p className="mt-2">
              For standard returns (change of mind, sizing, etc.), the buyer
              covers return shipping back to the seller.
            </p>
            <p className="mt-2">
              For returns due to <strong>seller fault</strong> — damaged on
              arrival, not as described, counterfeit, or never delivered —
              Bazaar covers return shipping and a full refund is issued.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Refund timeline</h2>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>
                Once the seller confirms receipt of the returned item, refunds
                are initiated within <strong>3 business days</strong>.
              </li>
              <li>
                Card refunds typically reflect on your statement within{" "}
                <strong>5–10 business days</strong>, depending on your bank.
              </li>
              <li>
                If a dispute is resolved in the buyer&apos;s favor, refund
                processing starts immediately on resolution.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Opening a dispute</h2>
            <p className="mt-2">
              If a seller is unresponsive or you disagree with the resolution
              offered, you can escalate to Bazaar by opening a dispute from the
              order page. You&apos;ll be asked to describe what went wrong and
              optionally attach evidence (photos, screenshots, etc.).
            </p>
            <p className="mt-2">
              Disputes are reviewed by our trust &amp; safety team. We may
              contact either party for additional information. A typical case is
              resolved within <strong>5–7 business days</strong>.
            </p>
            <p className="mt-2">
              You can view all of your open and resolved disputes at{" "}
              <Link href="/buyer/disputes" className="underline">
                /buyer/disputes
              </Link>
              .
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Items that cannot be returned</h2>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Perishable goods (food, flowers)</li>
              <li>Personal-care products that have been opened</li>
              <li>Digital downloads after they have been delivered</li>
              <li>
                Made-to-order or personalized items, unless damaged or defective
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Questions</h2>
            <p className="mt-2">
              For anything not covered here, please open a dispute on the
              relevant order or contact support. We&apos;re a US ↔ India
              marketplace, so please allow extra time for cross-border return
              shipping.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
