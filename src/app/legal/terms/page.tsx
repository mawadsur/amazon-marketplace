// /legal/terms — static terms of service. Public, no DB.

import Link from "next/link";
import { MarketplaceNav } from "@/components/buyer/marketplace-nav";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Terms of Service · Mirage",
  description:
    "The terms governing your use of Mirage — accounts, buyer and seller responsibilities, pricing and the flat 10% service charge, returns, and liability.",
};

export default function TermsOfServicePage() {
  return (
    <>
      <MarketplaceNav />
      <main className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-4xl font-semibold tracking-tight">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: January 2026
        </p>

        <section className="prose prose-sm mt-8 space-y-6 text-sm leading-relaxed text-foreground">
          <div>
            <h2 className="text-lg font-semibold">Acceptance of these terms</h2>
            <p className="mt-2">
              By creating an account, browsing, or making a purchase on Mirage,
              you agree to these Terms of Service. If you do not agree, please do
              not use the marketplace. These terms apply to everyone who uses
              Mirage, including buyers and sellers.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Your account</h2>
            <p className="mt-2">
              You are responsible for keeping your login credentials secure and
              for all activity under your account. Provide accurate information,
              keep it up to date, and notify us promptly of any unauthorized use.
              You must be old enough to form a binding contract in your
              jurisdiction to use Mirage.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Buyer responsibilities</h2>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>
                Provide accurate shipping and billing details, including any
                information needed for cross-border delivery.
              </li>
              <li>
                Pay for orders you place, including the item price, shipping, the
                service charge, and any applicable duties or taxes.
              </li>
              <li>
                Follow the{" "}
                <Link href="/legal/returns" className="amzn-link">
                  Returns &amp; refunds
                </Link>{" "}
                policy when requesting a return.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Seller &amp; listing rules</h2>
            <p className="mt-2">
              Sellers must be quality-vetted boutiques and may only list products
              they are authorized to sell. Listings must be accurate — honest
              descriptions, true-to-life photos, correct sizing, and clear
              materials. Counterfeit, illegal, or misrepresented items are not
              permitted and may result in removal and account suspension.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Pricing &amp; service charge</h2>
            <p className="mt-2">
              Sellers set their own item prices. Mirage adds a transparent,{" "}
              <strong>flat 10% service charge</strong> at checkout — there is no
              hidden markup on the product itself. This charge supports curation,
              buyer protection, dispute handling, and platform operations. The
              full breakdown of item price, shipping, the service charge, and any
              duties or taxes is shown before you confirm an order.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Returns</h2>
            <p className="mt-2">
              Returns and refunds are governed by our{" "}
              <Link href="/legal/returns" className="amzn-link">
                Returns &amp; refunds
              </Link>{" "}
              policy, which forms part of these terms. Please read it before
              purchasing, especially the rules around made-to-order items and
              cross-border return shipping.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Prohibited conduct</h2>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Fraud, chargeback abuse, or misrepresenting orders.</li>
              <li>
                Circumventing Mirage to transact off-platform after connecting
                here.
              </li>
              <li>
                Posting unlawful, infringing, harassing, or harmful content.
              </li>
              <li>
                Attempting to disrupt, scrape, or gain unauthorized access to the
                marketplace.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Liability</h2>
            <p className="mt-2">
              Mirage is a marketplace that connects buyers and sellers. To the
              fullest extent permitted by law, the service is provided &quot;as
              is,&quot; and our liability for any claim is limited to the amount
              you paid for the order giving rise to the claim. Nothing in these
              terms limits liability that cannot be limited under applicable law.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Governing law</h2>
            <p className="mt-2">
              These terms are governed by the laws of the State of Delaware,
              United States, without regard to its conflict-of-law rules. Where
              required, mandatory consumer-protection rights in your place of
              residence still apply.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Changes to these terms</h2>
            <p className="mt-2">
              We may update these terms from time to time. When we make material
              changes, we&apos;ll update the date above and, where appropriate,
              notify you. Continuing to use Mirage after changes take effect means
              you accept the updated terms.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Contact</h2>
            <p className="mt-2">
              Questions about these terms? Reach us at{" "}
              <Link href="mailto:legal@mirage.shop" className="amzn-link">
                legal@mirage.shop
              </Link>
              .
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
