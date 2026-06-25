import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { SiteFooter } from "@/components/marketplace/site-footer";
import { CookieBanner } from "@/components/marketplace/cookie-banner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Editorial serif for display headings — fashion/magazine register.
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const SITE_DESCRIPTION =
  "Curated sarees, lehengas, bridal couture and Indian jewelry — hand-picked direct from India's finest boutiques, with AI try-on previews, transparent pricing and a return guarantee.";

export const metadata: Metadata = {
  title: {
    default: "Mirage — Curated Indian fashion, direct from India's boutiques",
    template: "%s · Mirage",
  },
  description: SITE_DESCRIPTION,
  applicationName: "Mirage",
  openGraph: {
    title: "Mirage — Curated Indian fashion, direct from India's boutiques",
    description: SITE_DESCRIPTION,
    siteName: "Mirage",
    type: "website",
    images: [{ url: "/redesign/category-bridal.jpg", width: 1536, height: 2048, alt: "Mirage bridal edit" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mirage — Curated Indian fashion",
    description: SITE_DESCRIPTION,
    images: ["/redesign/category-bridal.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background font-sans text-foreground antialiased">
        {children}
        <SiteFooter />
        <CookieBanner />
      </body>
    </html>
  );
}
