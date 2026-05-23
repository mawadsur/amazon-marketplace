import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SiteFooter } from "@/components/marketplace/site-footer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bazaar — Authentic Indian goods, direct from the source",
  description:
    "Discover handicrafts, textiles, and jewelry from vetted Indian shops. AI-powered listings, transparent pricing, escrow protection.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background font-sans text-foreground antialiased">
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
