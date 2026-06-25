import type { MetadataRoute } from "next";

// Allow crawling of the storefront; keep account, seller, admin, API and
// checkout flows out of the index.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin", "/seller", "/buyer", "/checkout", "/cart"],
    },
    sitemap: "https://shezmin.com/sitemap.xml",
  };
}
