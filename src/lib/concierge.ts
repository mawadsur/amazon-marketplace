// AI Shopping Concierge (D2). Parses a buyer's natural-language search query
// into a structured intent — category, region, price ceiling/floor, keywords,
// gift context — that the catalog search can filter on.
//
// When ANTHROPIC_API_KEY is set, Claude does the parsing with strict JSON
// output. Otherwise we fall back to a regex/lexicon extractor that handles
// the common patterns ("under $50", "Tamil Nadu", "jewelry for my mother").

import { generateText } from "@/lib/ai";
import { env } from "@/lib/env";

export type SearchIntent = {
  /** Category slugs detected (subset of: handicrafts, textiles, jewelry). */
  categories: string[];
  /** Indian region names exactly as stored on Shop.region. */
  regions: string[];
  priceMaxUsdCents: number | null;
  priceMinUsdCents: number | null;
  /** Substantive nouns/adjectives the buyer mentioned. */
  keywords: string[];
  /** Free-text gift / occasion hint, e.g. "wedding", "diwali", "for my mother". */
  context: string | null;
  /** Original query, unchanged. */
  rawQuery: string;
  /** Whether Claude shaped the intent or the regex fallback ran. */
  aiAssisted: boolean;
};

const CATEGORIES = ["handicrafts", "textiles", "jewelry"] as const;

// Known regions in current seed + likely additions. Match case-insensitively.
const KNOWN_REGIONS = [
  "Rajasthan",
  "Karnataka",
  "Tamil Nadu",
  "Madhya Pradesh",
  "Gujarat",
  "Maharashtra",
  "Kerala",
  "West Bengal",
  "Uttar Pradesh",
  "Punjab",
  "Andhra Pradesh",
  "Telangana",
  "Odisha",
  "Assam",
];

// Lexicon hints: word → category. Order matters; first match wins.
const CATEGORY_LEXICON: Array<[RegExp, (typeof CATEGORIES)[number]]> = [
  [/saree|sari|kurta|fabric|textile|silk|cotton|weav|dupatta|shawl|stole|kantha/i, "textiles"],
  [/necklace|earring|ring|bracelet|pendant|jewel|jhumka|bangle|anklet|nose ring/i, "jewelry"],
  [/vase|basket|handicraft|pottery|brass|carv|wood|terra ?cotta|brassware|lacquer/i, "handicrafts"],
];

// Common context words. Not exhaustive — fallback only.
const CONTEXT_PATTERNS: Array<{ rx: RegExp; phrase: string }> = [
  { rx: /\bwedding|bride|groom|marriage\b/i, phrase: "wedding" },
  { rx: /\bdiwali|festival|holiday|holi|christmas\b/i, phrase: "festival" },
  { rx: /\bbirthday\b/i, phrase: "birthday" },
  { rx: /\b(gift|present)\s+for\s+\w+/i, phrase: "gift" },
  { rx: /\bfor\s+(my\s+)?(mother|mom|mum|wife|husband|dad|father|sister|brother|friend|partner)\b/i, phrase: "gift" },
];

// ---------------------------------------------------------------- regex fallback

function extractPriceCents(q: string): { min: number | null; max: number | null } {
  const lower = q.toLowerCase();
  let min: number | null = null;
  let max: number | null = null;

  // "$50-$100" or "50 to 100"
  const range = lower.match(/\$?(\d{1,5})\s*(?:-|–|to)\s*\$?(\d{1,5})/);
  if (range) {
    const a = Number(range[1]);
    const b = Number(range[2]);
    min = Math.min(a, b) * 100;
    max = Math.max(a, b) * 100;
    return { min, max };
  }

  const underMatch = lower.match(/(?:under|below|less than|<=?)\s*\$?(\d{1,5})/);
  if (underMatch) max = Number(underMatch[1]) * 100;

  const overMatch = lower.match(/(?:over|above|more than|>=?)\s*\$?(\d{1,5})/);
  if (overMatch) min = Number(overMatch[1]) * 100;

  return { min, max };
}

function extractCategoriesFromText(q: string): string[] {
  const found = new Set<string>();
  for (const [rx, cat] of CATEGORY_LEXICON) {
    if (rx.test(q)) found.add(cat);
  }
  // Explicit category mentions
  for (const cat of CATEGORIES) {
    if (new RegExp(`\\b${cat}\\b`, "i").test(q)) found.add(cat);
  }
  return Array.from(found);
}

function extractRegions(q: string): string[] {
  const found = new Set<string>();
  for (const region of KNOWN_REGIONS) {
    const rx = new RegExp(`\\b${region.replace(/\s+/g, "\\s+")}\\b`, "i");
    if (rx.test(q)) found.add(region);
  }
  return Array.from(found);
}

function extractContext(q: string): string | null {
  for (const { rx, phrase } of CONTEXT_PATTERNS) {
    if (rx.test(q)) return phrase;
  }
  return null;
}

function extractKeywords(q: string, removed: string[]): string[] {
  let working = q.toLowerCase();
  for (const r of removed) {
    working = working.replace(new RegExp(r.toLowerCase(), "g"), " ");
  }
  // Drop common stop words + price words + gift words
  const stop = new Set([
    "a","an","the","for","my","under","over","above","below","less","more","than","to",
    "and","or","with","in","of","is","gift","present","mother","mom","father","dad",
    "wife","husband","sister","brother","friend","partner",
  ]);
  return working
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !stop.has(w) && !/^\d+$/.test(w))
    .slice(0, 8);
}

function regexParse(query: string): SearchIntent {
  const { min, max } = extractPriceCents(query);
  const categories = extractCategoriesFromText(query);
  const regions = extractRegions(query);
  const context = extractContext(query);
  const keywords = extractKeywords(query, [...regions, ...categories]);

  return {
    categories,
    regions,
    priceMaxUsdCents: max,
    priceMinUsdCents: min,
    keywords,
    context,
    rawQuery: query,
    aiAssisted: false,
  };
}

// ---------------------------------------------------------------- Claude path

async function claudeParse(query: string): Promise<SearchIntent | null> {
  if (!env.ANTHROPIC_API_KEY) return null;
  const sys = `You parse a buyer's search query for an Indian goods marketplace. Output STRICT JSON only — no preamble, no markdown fences.

Known categories: handicrafts, textiles, jewelry.
Known regions: ${KNOWN_REGIONS.join(", ")}.

Schema: {
  "categories": string[],
  "regions": string[] (use the exact names from the list above),
  "priceMaxUsdCents": integer | null,
  "priceMinUsdCents": integer | null,
  "keywords": string[] (substantive nouns/adjectives only),
  "context": string | null (occasion or gift recipient, e.g. "wedding", "gift")
}

Do NOT invent values. If something isn't mentioned, leave it null/empty.`;

  try {
    const { text } = await generateText({
      system: sys,
      prompt: `Query: ${query}\n\nReturn only JSON.`,
      maxTokens: 400,
    });
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const parsed = JSON.parse(m[0]) as Partial<SearchIntent>;
    const categories = Array.isArray(parsed.categories)
      ? parsed.categories
          .map(String)
          .map((s) => s.toLowerCase())
          .filter((s): s is (typeof CATEGORIES)[number] =>
            (CATEGORIES as readonly string[]).includes(s),
          )
      : [];
    const regions = Array.isArray(parsed.regions)
      ? parsed.regions
          .map(String)
          .filter((r) => KNOWN_REGIONS.some((k) => k.toLowerCase() === r.toLowerCase()))
          .map((r) => KNOWN_REGIONS.find((k) => k.toLowerCase() === r.toLowerCase()) ?? r)
      : [];
    return {
      categories,
      regions,
      priceMaxUsdCents:
        typeof parsed.priceMaxUsdCents === "number" ? Math.round(parsed.priceMaxUsdCents) : null,
      priceMinUsdCents:
        typeof parsed.priceMinUsdCents === "number" ? Math.round(parsed.priceMinUsdCents) : null,
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.map(String).slice(0, 8) : [],
      context: typeof parsed.context === "string" ? parsed.context : null,
      rawQuery: query,
      aiAssisted: true,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- entry

export async function parseIntent(query: string): Promise<SearchIntent> {
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      categories: [],
      regions: [],
      priceMaxUsdCents: null,
      priceMinUsdCents: null,
      keywords: [],
      context: null,
      rawQuery: "",
      aiAssisted: false,
    };
  }
  const claude = await claudeParse(trimmed);
  return claude ?? regexParse(trimmed);
}

/** Format the intent for display next to the search bar as colored chips. */
export function intentChips(intent: SearchIntent): Array<{ label: string; tone: string }> {
  const chips: Array<{ label: string; tone: string }> = [];
  for (const c of intent.categories) {
    chips.push({ label: c, tone: "bg-amber-50 text-amber-800 border-amber-200" });
  }
  for (const r of intent.regions) {
    chips.push({ label: r, tone: "bg-emerald-50 text-emerald-800 border-emerald-200" });
  }
  if (intent.priceMaxUsdCents !== null) {
    chips.push({
      label: `under $${Math.round(intent.priceMaxUsdCents / 100)}`,
      tone: "bg-sky-50 text-sky-800 border-sky-200",
    });
  }
  if (intent.priceMinUsdCents !== null) {
    chips.push({
      label: `over $${Math.round(intent.priceMinUsdCents / 100)}`,
      tone: "bg-sky-50 text-sky-800 border-sky-200",
    });
  }
  if (intent.context) {
    chips.push({ label: intent.context, tone: "bg-purple-50 text-purple-800 border-purple-200" });
  }
  return chips;
}
