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

// ================================================================
// Multi-turn concierge — refine a prior intent with a follow-up utterance.
// ================================================================

export type ConciergeTurn = { role: "user" | "assistant"; text: string };

export type RefineResult = {
  intent: SearchIntent;
  /** One short line to show/speak back to the buyer. */
  assistantReply: string;
  /** True when the user asked to start over. */
  reset: boolean;
};

export function emptyIntent(): SearchIntent {
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

// Materials we recognise so "only silk" can replace "cotton", etc.
const MATERIAL_LEXICON = [
  "silk", "cotton", "linen", "georgette", "chiffon", "velvet", "brocade",
  "zari", "wool", "satin", "organza", "banarasi", "chanderi",
];

// City → stored Shop.region (only cities whose region is in KNOWN_REGIONS).
const CITY_TO_REGION: Record<string, string> = {
  mumbai: "Maharashtra",
  pune: "Maharashtra",
  kolhapur: "Maharashtra",
  bengaluru: "Karnataka",
  bangalore: "Karnataka",
  mysore: "Karnataka",
  chennai: "Tamil Nadu",
  kanchipuram: "Tamil Nadu",
  thanjavur: "Tamil Nadu",
  jaipur: "Rajasthan",
  jodhpur: "Rajasthan",
  kolkata: "West Bengal",
  ahmedabad: "Gujarat",
  surat: "Gujarat",
  bhuj: "Gujarat",
  hyderabad: "Telangana",
  varanasi: "Uttar Pradesh",
  lucknow: "Uttar Pradesh",
  agra: "Uttar Pradesh",
  moradabad: "Uttar Pradesh",
  kochi: "Kerala",
  alleppey: "Kerala",
  kannur: "Kerala",
};

const RESET_RX = /\b(start over|reset|clear (it|all|everything)|new search|never\s?mind|forget (it|that))\b/i;

function detectCityRegions(q: string): string[] {
  const found = new Set<string>();
  const lower = q.toLowerCase();
  for (const [city, region] of Object.entries(CITY_TO_REGION)) {
    if (new RegExp(`\\b${city}\\b`, "i").test(lower)) found.add(region);
  }
  return Array.from(found);
}

function detectMaterials(q: string): string[] {
  const lower = q.toLowerCase();
  return MATERIAL_LEXICON.filter((m) => new RegExp(`\\b${m}\\b`).test(lower));
}

/** Round cents to a clean $5 step, with a $5 floor. */
function cleanDollarStep(cents: number): number {
  return Math.max(500, Math.round(cents / 500) * 500);
}

function synthQuery(intent: SearchIntent): string {
  const parts: string[] = [...intent.categories, ...intent.regions, ...intent.keywords];
  if (intent.priceMaxUsdCents !== null) parts.push(`under $${Math.round(intent.priceMaxUsdCents / 100)}`);
  if (intent.priceMinUsdCents !== null) parts.push(`over $${Math.round(intent.priceMinUsdCents / 100)}`);
  if (intent.context) parts.push(intent.context);
  return parts.join(" ").trim();
}

function describeIntent(intent: SearchIntent): string {
  const bits: string[] = [];
  if (intent.keywords.length) bits.push(intent.keywords.join(" "));
  if (intent.categories.length) bits.push(intent.categories.join(" & "));
  const where = intent.regions.length ? ` from ${intent.regions.join(" & ")}` : "";
  let price = "";
  if (intent.priceMaxUsdCents !== null) price += ` under $${Math.round(intent.priceMaxUsdCents / 100)}`;
  if (intent.priceMinUsdCents !== null) price += ` over $${Math.round(intent.priceMinUsdCents / 100)}`;
  const subject = bits.join(" ") || "items";
  return `Showing ${subject}${where}${price}.`.replace(/\s+/g, " ").trim();
}

/**
 * Deterministic delta-merge of a follow-up utterance into a prior intent.
 * Exported for unit testing and used as the no-API-key fallback.
 */
export function mergeIntentDelta(prior: SearchIntent, utterance: string): RefineResult {
  const u = utterance.trim();
  if (!u) return { intent: prior, assistantReply: describeIntent(prior), reset: false };

  if (RESET_RX.test(u)) {
    return { intent: emptyIntent(), assistantReply: "Starting fresh. What are you looking for?", reset: true };
  }

  const next: SearchIntent = {
    ...prior,
    categories: [...prior.categories],
    regions: [...prior.regions],
    keywords: [...prior.keywords],
    aiAssisted: false,
  };
  const lower = u.toLowerCase();

  // --- Price -------------------------------------------------------------
  const explicit = extractPriceCents(u);
  if (explicit.max !== null) next.priceMaxUsdCents = explicit.max;
  if (explicit.min !== null) next.priceMinUsdCents = explicit.min;

  const cheaper = /\b(cheaper|less expensive|lower( price)?|more affordable|budget)\b/.test(lower);
  const pricier = /\b(more expensive|pricier|fancier|premium|higher( price)?|luxury|nicer)\b/.test(lower);
  if (cheaper && explicit.max === null) {
    if (prior.priceMaxUsdCents !== null) next.priceMaxUsdCents = cleanDollarStep(prior.priceMaxUsdCents * 0.6);
    else if (prior.priceMinUsdCents !== null) { next.priceMaxUsdCents = prior.priceMinUsdCents; next.priceMinUsdCents = null; }
    else next.priceMaxUsdCents = 5000;
  }
  if (pricier && explicit.min === null) {
    if (prior.priceMinUsdCents !== null) next.priceMinUsdCents = cleanDollarStep(prior.priceMinUsdCents * 1.5);
    else if (prior.priceMaxUsdCents !== null) { next.priceMinUsdCents = prior.priceMaxUsdCents; next.priceMaxUsdCents = null; }
    else next.priceMinUsdCents = 10000;
  }

  // Removal of facets.
  if (/\b(any price|remove (the )?price|drop (the )?price)\b/.test(lower)) {
    next.priceMaxUsdCents = null;
    next.priceMinUsdCents = null;
  }
  if (/\b(any ?where|any region|remove (the )?region|drop (the )?region)\b/.test(lower)) {
    next.regions = [];
  }
  if (/\b(any category|all categories|remove (the )?category)\b/.test(lower)) {
    next.categories = [];
  }

  // --- Region (cities + states) -----------------------------------------
  const regionHits = [...new Set([...extractRegions(u), ...detectCityRegions(u)])];
  if (regionHits.length) {
    // "also" → additive; otherwise switch.
    next.regions = /\balso\b/.test(lower)
      ? [...new Set([...next.regions, ...regionHits])]
      : regionHits;
  }

  // --- Category ----------------------------------------------------------
  const catHits = extractCategoriesFromText(u);
  if (catHits.length) {
    next.categories = /\b(instead|actually|rather)\b/.test(lower)
      ? catHits
      : [...new Set([...next.categories, ...catHits])];
  }

  // --- Materials ("only silk" replaces other materials) ------------------
  const materials = detectMaterials(u);
  if (materials.length) {
    next.keywords = next.keywords.filter((k) => !MATERIAL_LEXICON.includes(k.toLowerCase()));
    next.keywords = [...new Set([...next.keywords, ...materials])];
  }

  // --- Context -----------------------------------------------------------
  const ctx = extractContext(u);
  if (ctx) next.context = ctx;

  // --- Leftover keywords (additive) -------------------------------------
  const leftover = extractKeywords(u, [...regionHits, ...catHits, ...materials]).filter(
    (k) => !MATERIAL_LEXICON.includes(k),
  );
  if (leftover.length) {
    next.keywords = [...new Set([...next.keywords, ...leftover])].slice(0, 8);
  }

  next.rawQuery = synthQuery(next);
  return { intent: next, assistantReply: describeIntent(next), reset: false };
}

async function claudeRefine(
  prior: SearchIntent,
  utterance: string,
  history: ConciergeTurn[],
): Promise<RefineResult | null> {
  if (!env.ANTHROPIC_API_KEY) return null;
  const sys = `You refine a shopping filter for an Indian goods marketplace. Apply the user's follow-up as a DELTA to the prior filter (e.g. "cheaper" lowers the max, "only silk" replaces the material keyword, "from Mumbai" sets region Maharashtra, "start over" resets everything).

Known categories: ${CATEGORIES.join(", ")}.
Known regions (use exact names): ${KNOWN_REGIONS.join(", ")}.

Output STRICT JSON only — no markdown:
{
  "categories": string[],
  "regions": string[],
  "priceMaxUsdCents": integer | null,
  "priceMinUsdCents": integer | null,
  "keywords": string[],
  "context": string | null,
  "assistantReply": string (one short sentence),
  "reset": boolean
}
Echo unchanged fields from the prior filter. Prices are in USD cents.`;

  const recent = history.slice(-6).map((t) => `${t.role}: ${t.text}`).join("\n");
  const prompt = `PRIOR_FILTER: ${JSON.stringify({
    categories: prior.categories,
    regions: prior.regions,
    priceMaxUsdCents: prior.priceMaxUsdCents,
    priceMinUsdCents: prior.priceMinUsdCents,
    keywords: prior.keywords,
    context: prior.context,
  })}
${recent ? `\nCONVERSATION:\n${recent}\n` : ""}
USER_FOLLOWUP: ${utterance}

Return only JSON.`;

  try {
    const { text } = await generateText({ system: sys, prompt, maxTokens: 400 });
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const parsed = JSON.parse(m[0]) as Partial<SearchIntent> & {
      assistantReply?: string;
      reset?: boolean;
    };
    if (parsed.reset) {
      return { intent: emptyIntent(), assistantReply: parsed.assistantReply || "Starting fresh.", reset: true };
    }
    const categories = Array.isArray(parsed.categories)
      ? parsed.categories.map(String).map((s) => s.toLowerCase()).filter((s): s is (typeof CATEGORIES)[number] => (CATEGORIES as readonly string[]).includes(s))
      : prior.categories;
    const regions = Array.isArray(parsed.regions)
      ? parsed.regions.map(String).filter((r) => KNOWN_REGIONS.some((k) => k.toLowerCase() === r.toLowerCase())).map((r) => KNOWN_REGIONS.find((k) => k.toLowerCase() === r.toLowerCase()) ?? r)
      : prior.regions;
    const intent: SearchIntent = {
      categories,
      regions,
      priceMaxUsdCents: typeof parsed.priceMaxUsdCents === "number" ? Math.round(parsed.priceMaxUsdCents) : parsed.priceMaxUsdCents === null ? null : prior.priceMaxUsdCents,
      priceMinUsdCents: typeof parsed.priceMinUsdCents === "number" ? Math.round(parsed.priceMinUsdCents) : parsed.priceMinUsdCents === null ? null : prior.priceMinUsdCents,
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.map(String).slice(0, 8) : prior.keywords,
      context: typeof parsed.context === "string" ? parsed.context : parsed.context === null ? null : prior.context,
      rawQuery: "",
      aiAssisted: true,
    };
    intent.rawQuery = synthQuery(intent);
    return {
      intent,
      assistantReply: parsed.assistantReply || describeIntent(intent),
      reset: false,
    };
  } catch {
    return null;
  }
}

/**
 * Refine a prior intent with a follow-up utterance. Claude when keyed, with a
 * deterministic merge fallback so the concierge works with no API key.
 */
export async function refineIntent(
  prior: SearchIntent,
  utterance: string,
  history: ConciergeTurn[] = [],
): Promise<RefineResult> {
  const claude = await claudeRefine(prior, utterance, history);
  return claude ?? mergeIntentDelta(prior, utterance);
}

// ---------------------------------------------------------------- removable chips

export type RemovableFacet = "category" | "region" | "priceMax" | "priceMin" | "context" | "keyword";

export type RemovableChip = {
  id: string;
  label: string;
  tone: string;
  facet: RemovableFacet;
  value: string;
};

/** Like intentChips, but each chip carries the facet/value needed to remove it. */
export function removableChips(intent: SearchIntent): RemovableChip[] {
  const chips: RemovableChip[] = [];
  for (const c of intent.categories) {
    chips.push({ id: `cat:${c}`, label: c, tone: "bg-amber-50 text-amber-800 border-amber-200", facet: "category", value: c });
  }
  for (const r of intent.regions) {
    chips.push({ id: `region:${r}`, label: r, tone: "bg-emerald-50 text-emerald-800 border-emerald-200", facet: "region", value: r });
  }
  if (intent.priceMaxUsdCents !== null) {
    chips.push({ id: "priceMax", label: `under $${Math.round(intent.priceMaxUsdCents / 100)}`, tone: "bg-sky-50 text-sky-800 border-sky-200", facet: "priceMax", value: "" });
  }
  if (intent.priceMinUsdCents !== null) {
    chips.push({ id: "priceMin", label: `over $${Math.round(intent.priceMinUsdCents / 100)}`, tone: "bg-sky-50 text-sky-800 border-sky-200", facet: "priceMin", value: "" });
  }
  if (intent.context) {
    chips.push({ id: `ctx:${intent.context}`, label: intent.context, tone: "bg-purple-50 text-purple-800 border-purple-200", facet: "context", value: intent.context });
  }
  for (const k of intent.keywords) {
    chips.push({ id: `kw:${k}`, label: k, tone: "bg-muted text-muted-foreground border-border", facet: "keyword", value: k });
  }
  return chips;
}

/**
 * Trust an incoming intent shape loosely — it round-trips from our own client.
 * Returns null for non-object input; otherwise coerces every field to a valid
 * SearchIntent shape (arrays default empty, prices null, strings defaulted).
 */
export function coerceIntent(raw: unknown): SearchIntent | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  return {
    categories: Array.isArray(r.categories) ? r.categories.map(String) : [],
    regions: Array.isArray(r.regions) ? r.regions.map(String) : [],
    priceMaxUsdCents: typeof r.priceMaxUsdCents === "number" ? r.priceMaxUsdCents : null,
    priceMinUsdCents: typeof r.priceMinUsdCents === "number" ? r.priceMinUsdCents : null,
    keywords: Array.isArray(r.keywords) ? r.keywords.map(String) : [],
    context: typeof r.context === "string" ? r.context : null,
    rawQuery: typeof r.rawQuery === "string" ? r.rawQuery : "",
    aiAssisted: Boolean(r.aiAssisted),
  };
}

/**
 * Pick a single facet to suggest relaxing when there are zero results.
 * Priority order: priceMax → keyword → region → category → priceMin → context.
 */
export function relaxationSuggestion(
  chips: RemovableChip[],
): { facet: string; value: string; label: string } | null {
  const priority = ["priceMax", "keyword", "region", "category", "priceMin", "context"];
  for (const facet of priority) {
    const chip = chips.find((c) => c.facet === facet);
    if (chip) return { facet: chip.facet, value: chip.value, label: chip.label };
  }
  return null;
}

/** Return a new intent with the named facet/value removed. */
export function removeFacet(intent: SearchIntent, facet: RemovableFacet, value: string): SearchIntent {
  const next: SearchIntent = {
    ...intent,
    categories: [...intent.categories],
    regions: [...intent.regions],
    keywords: [...intent.keywords],
  };
  switch (facet) {
    case "category":
      next.categories = next.categories.filter((c) => c !== value);
      break;
    case "region":
      next.regions = next.regions.filter((r) => r !== value);
      break;
    case "priceMax":
      next.priceMaxUsdCents = null;
      break;
    case "priceMin":
      next.priceMinUsdCents = null;
      break;
    case "context":
      next.context = null;
      break;
    case "keyword":
      next.keywords = next.keywords.filter((k) => k !== value);
      break;
  }
  next.rawQuery = synthQuery(next);
  return next;
}
