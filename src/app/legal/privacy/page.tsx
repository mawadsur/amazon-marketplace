// /legal/privacy — static privacy policy. Public, no DB.

import Link from "next/link";
import { MarketplaceNav } from "@/components/buyer/marketplace-nav";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Privacy Policy · Shezmin",
  description:
    "How Shezmin collects, uses, and protects your data as an online clothing brand — accounts, orders, cookies, and your rights.",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <MarketplaceNav />
      <main className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-4xl font-semibold tracking-tight">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: January 2026
        </p>

        <section className="prose prose-sm mt-8 space-y-6 text-sm leading-relaxed text-foreground">
          <div>
            <p>
              Shezmin is a curated online clothing brand, delivering apparel
              direct from India&apos;s finest boutiques to your door. This policy
              explains what we collect, why we collect it, and the choices you
              have. By using Shezmin you agree to the practices described here.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">What data we collect</h2>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>
                <strong>Account information</strong> — your name, email address,
                password (stored only as a secure hash), and any profile details
                you choose to add.
              </li>
              <li>
                <strong>Order &amp; shipping details</strong> — items purchased,
                delivery and billing addresses, contact phone, and order history
                needed to fulfil and support your purchases.
              </li>
              <li>
                <strong>Payment data</strong> — handled by our payment processor.
                Shezmin never stores your full card number; we retain only a token
                and the last four digits for receipts and dispute resolution.
              </li>
              <li>
                <strong>Cookies &amp; usage data</strong> — device, browser, pages
                viewed, and similar analytics that help us run and improve the
                site.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold">How we use your data</h2>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>To create your account and process and deliver your orders.</li>
              <li>
                To provide customer support, handle returns, and resolve disputes.
              </li>
              <li>
                To personalize your shopping experience and show relevant
                products.
              </li>
              <li>
                To detect fraud, keep your account safe, and meet legal and
                tax obligations across the US and India.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Cookies &amp; consent</h2>
            <p className="mt-2">
              We use cookies for essential site functions (such as keeping you
              signed in and your cart intact) and for analytics. When you first
              visit Shezmin you&apos;ll see a cookie banner; the choice you make
              there is stored in your browser, so the banner won&apos;t reappear
              on that device unless you clear your browser data.
            </p>
            <p className="mt-2">
              You can clear or block cookies in your browser settings at any time,
              though some features of the store may not work as expected if
              essential cookies are disabled.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Third parties we share with</h2>
            <p className="mt-2">
              We share only the data needed to run the store, never sell your
              personal information, and require partners to protect it:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>
                <strong>Payment processors</strong> to authorize and settle your
                payments securely.
              </li>
              <li>
                <strong>Shipping &amp; logistics carriers</strong> to deliver your
                orders and provide cross-border tracking.
              </li>
              <li>
                <strong>The boutique seller</strong> fulfilling your order,
                limited to the shipping details required to ship it.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Data retention</h2>
            <p className="mt-2">
              We keep order and transaction records for as long as needed to
              provide our services and to satisfy legal, accounting, and tax
              requirements — typically several years for completed orders. When
              data is no longer required, we delete or anonymize it.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Your rights</h2>
            <p className="mt-2">
              Depending on where you live, you may have the right to access,
              correct, export, or delete your personal data, and to object to
              certain processing. You can review and update most account details
              directly in your profile, or contact us to make a request. We
              will respond within a reasonable time and in line with applicable
              law.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Contact</h2>
            <p className="mt-2">
              Questions about your privacy or this policy? Reach our team at{" "}
              <Link href="mailto:privacy@shezmin.com" className="amzn-link">
                privacy@shezmin.com
              </Link>
              . You can also review our{" "}
              <Link href="/legal/terms" className="amzn-link">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/legal/returns" className="amzn-link">
                Returns &amp; refunds
              </Link>{" "}
              policy.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
