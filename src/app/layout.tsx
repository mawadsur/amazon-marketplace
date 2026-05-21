import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en" className="h-full">
      <body className="min-h-full bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
