import type { MetadataRoute } from "next";

const BASE = "https://shezmin.com";

// Static sitemap of key public routes. Product/shop pages are force-dynamic and
// excluded here; add a dynamic generator later if SEO indexing of the catalog is wanted.
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/shop",
    "/search",
    "/shop/category/textiles",
    "/shop/category/jewelry",
    "/shop/category/handicrafts",
    "/about",
    "/about/story",
    "/help/faq",
    "/legal/privacy",
    "/legal/terms",
    "/legal/returns",
    "/sign-in",
  ];
  return routes.map((r) => ({
    url: `${BASE}${r}`,
    changeFrequency: r === "" ? "daily" : "weekly",
    priority: r === "" ? 1 : 0.7,
  }));
}
