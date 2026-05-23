import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
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
      className={`${inter.variable} ${playfair.variable} dark h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
