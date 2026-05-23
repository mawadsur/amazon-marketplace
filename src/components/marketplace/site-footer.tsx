"use client";

import Link from "next/link";
import { ArrowUp, Globe } from "lucide-react";

type FooterLink = { href: string; label: string };
type FooterColumn = { title: string; links: FooterLink[] };

const COLUMNS: FooterColumn[] = [
  {
    title: "Get to Know Us",
    links: [
      { href: "/about", label: "About Bazaar" },
      { href: "/about/story", label: "Our Story" },
      { href: "/about/ai-listings", label: "How AI Listings Work" },
    ],
  },
  {
    title: "Make Money with Us",
    links: [
      { href: "/seller", label: "Sell on Bazaar" },
      { href: "/seller/partners", label: "Become a Partner" },
    ],
  },
  {
    title: "Buyer Services",
    links: [
      { href: "/legal/returns", label: "Returns & Refunds" },
      { href: "/legal/protection", label: "Buyer Protection" },
      { href: "/buyer/orders", label: "Order Tracking" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/help", label: "Customer Service" },
      { href: "/help/faq", label: "FAQ" },
      { href: "/help/contact", label: "Contact" },
    ],
  },
];

function scrollToTop() {
  if (typeof window === "undefined") return;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function SiteFooter() {
  return (
    <footer className="mt-12">
      {/* Back to top */}
      <button
        type="button"
        onClick={scrollToTop}
        className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 bg-subheader text-sm font-medium text-white transition-colors duration-200 hover:bg-[#3a4553]"
      >
        <ArrowUp className="h-4 w-4" aria-hidden="true" />
        <span>Back to top</span>
      </button>

      {/* Main footer */}
      <div className="bg-header text-white">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-10 sm:grid-cols-2 md:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="mb-3 text-base font-bold">{col.title}</h3>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="block cursor-pointer py-1 text-sm text-white/80 transition-colors duration-200 hover:text-white hover:underline"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Brand divider */}
        <div className="border-t border-white/15">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-4 px-6 py-6">
            <Link
              href="/"
              className="cursor-pointer text-xl font-bold tracking-tight text-white transition-colors duration-200 hover:text-primary"
            >
              Bazaar
            </Link>
            <button
              type="button"
              className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-sm border border-white/30 px-3 text-xs font-medium text-white transition-colors duration-200 hover:border-white"
              aria-label="Language: English"
            >
              <Globe className="h-4 w-4" aria-hidden="true" />
              <span>English</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-subheader text-white/70">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-2 px-6 py-5 text-xs sm:flex-row sm:gap-6">
          <Link
            href="/legal/privacy"
            className="cursor-pointer transition-colors duration-200 hover:text-white hover:underline"
          >
            Privacy Notice
          </Link>
          <Link
            href="/legal/terms"
            className="cursor-pointer transition-colors duration-200 hover:text-white hover:underline"
          >
            Conditions of Use
          </Link>
          <Link
            href="/legal/cookies"
            className="cursor-pointer transition-colors duration-200 hover:text-white hover:underline"
          >
            Cookies Notice
          </Link>
          <span className="text-center">
            &copy; {new Date().getFullYear()} Bazaar Marketplace, Inc.
          </span>
        </div>
      </div>
    </footer>
  );
}
