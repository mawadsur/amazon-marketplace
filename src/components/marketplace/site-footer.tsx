"use client";

import Link from "next/link";
import { ArrowUp, Truck, ShieldCheck, RefreshCcw } from "lucide-react";

type FooterLink = { href: string; label: string };
type FooterColumn = { title: string; links: FooterLink[] };

const COLUMNS: FooterColumn[] = [
  {
    title: "Shop",
    links: [
      { href: "/shop/category/textiles", label: "Designer Sarees" },
      { href: "/search?cat=textiles", label: "Lehenga & Suits" },
      { href: "/shop/category/jewelry", label: "Jewelry" },
      { href: "/shop/category/handicrafts", label: "Accessories" },
    ],
  },
  {
    title: "Get to Know Us",
    links: [
      { href: "/about/story", label: "Our Story" },
      { href: "/about", label: "About Shezmin" },
      { href: "/seller", label: "Sell with Us" },
    ],
  },
  {
    title: "Customer Care",
    links: [
      { href: "/legal/returns", label: "Shipping & Returns" },
      { href: "/legal/returns", label: "Sizing & Alterations" },
      { href: "/buyer/orders", label: "Order Tracking" },
      { href: "/help/faq", label: "FAQ" },
    ],
  },
];

function scrollToTop() {
  if (typeof window === "undefined") return;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function SiteFooter() {
  return (
    <footer className="mt-16">
      {/* Back to top */}
      <button
        type="button"
        onClick={scrollToTop}
        className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 bg-subheader text-sm font-medium uppercase tracking-wide text-background transition-colors duration-200 hover:brightness-110"
      >
        <ArrowUp className="h-4 w-4" aria-hidden="true" />
        <span>Back to top</span>
      </button>

      {/* Main footer */}
      <div className="bg-header text-background">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand + online promise */}
          <div>
            <Link href="/" className="flex flex-col leading-none" aria-label="Shezmin home">
              <span className="font-display text-2xl font-semibold text-background">
                Shezmin
              </span>
              <span className="text-[10px] font-medium uppercase tracking-[0.32em] text-background/60">
                shezmin.com
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-background/70">
              A curated online clothing brand, delivering apparel direct from
              India&apos;s finest boutiques.
            </p>
            <ul className="mt-5 space-y-2.5 text-sm text-background/80">
              <li className="flex items-start gap-2.5">
                <Truck className="mt-0.5 h-4 w-4 flex-shrink-0 text-secondary" aria-hidden />
                <span>Worldwide shipping, duties prepaid</span>
              </li>
              <li className="flex items-start gap-2.5">
                <RefreshCcw className="mt-0.5 h-4 w-4 flex-shrink-0 text-secondary" aria-hidden />
                <span>Try-on previews &amp; a return guarantee</span>
              </li>
              <li className="flex items-start gap-2.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-secondary" aria-hidden />
                <span>Vetted boutiques, transparent pricing</span>
              </li>
            </ul>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-background/60">
                {col.title}
              </h3>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={`${col.title}-${l.label}`}>
                    <Link
                      href={l.href}
                      className="block cursor-pointer py-1 text-sm text-background/80 transition-colors duration-200 hover:text-background hover:underline"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter band */}
        <div className="border-t border-background/15">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-6 text-center sm:flex-row sm:text-left">
            <p className="text-sm text-background/80">
              Sign up for our newsletter to stay up to date on sales and events.
            </p>
            <form className="flex w-full max-w-sm items-stretch gap-2 sm:w-auto">
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                autoComplete="email"
                placeholder="Your email"
                className="h-10 min-w-0 flex-1 rounded-md border border-background/25 bg-transparent px-3 text-sm text-background placeholder:text-background/50 focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary sm:w-56"
              />
              <button
                type="submit"
                className="h-10 cursor-pointer rounded-md bg-secondary px-4 text-sm font-semibold uppercase tracking-wide text-secondary-foreground transition-colors duration-200 hover:bg-[#B45309]"
              >
                Sign up
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-subheader text-background/70">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-2 px-6 py-5 text-xs sm:flex-row sm:gap-6">
          <Link href="/legal/privacy" className="cursor-pointer transition-colors duration-200 hover:text-background hover:underline">
            Privacy Policy
          </Link>
          <Link href="/legal/terms" className="cursor-pointer transition-colors duration-200 hover:text-background hover:underline">
            Terms of Service
          </Link>
          <Link href="/legal/returns" className="cursor-pointer transition-colors duration-200 hover:text-background hover:underline">
            Shipping & Returns
          </Link>
          <span className="text-center">
            &copy; {new Date().getFullYear()} Shezmin. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}
