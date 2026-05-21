import { describe, expect, it } from "vitest";
import { parseIntent, intentChips } from "@/lib/concierge";

// These tests cover the regex fallback path. The Claude path is exercised only
// when ANTHROPIC_API_KEY is set, which is never the case in CI.

describe("parseIntent (regex fallback)", () => {
  it("extracts a price ceiling from 'under $50'", async () => {
    const intent = await parseIntent("blue saree under $50");
    expect(intent.priceMaxUsdCents).toBe(5_000);
    expect(intent.aiAssisted).toBe(false);
  });

  it("extracts a price range from '$50-$100'", async () => {
    const intent = await parseIntent("jewelry $50-100");
    expect(intent.priceMinUsdCents).toBe(5_000);
    expect(intent.priceMaxUsdCents).toBe(10_000);
  });

  it("detects categories via lexicon", async () => {
    const saree = await parseIntent("handwoven silk saree");
    expect(saree.categories).toContain("textiles");

    const necklace = await parseIntent("gold necklace");
    expect(necklace.categories).toContain("jewelry");

    const vase = await parseIntent("hand-carved wooden vase");
    expect(vase.categories).toContain("handicrafts");
  });

  it("detects known Indian regions", async () => {
    const tn = await parseIntent("saree from Tamil Nadu");
    expect(tn.regions).toContain("Tamil Nadu");

    const raj = await parseIntent("rajasthan handicrafts");
    expect(raj.regions).toContain("Rajasthan");
  });

  it("detects gift context", async () => {
    const gift = await parseIntent("wedding gift for my mother");
    expect(gift.context).toBeTruthy();
  });

  it("returns an empty intent for an empty query", async () => {
    const empty = await parseIntent("");
    expect(empty.categories).toHaveLength(0);
    expect(empty.regions).toHaveLength(0);
    expect(empty.priceMaxUsdCents).toBeNull();
    expect(empty.keywords).toHaveLength(0);
  });

  it("filters keywords down to substantive words", async () => {
    const intent = await parseIntent("a gift for my mother under $50");
    expect(intent.keywords).not.toContain("a");
    expect(intent.keywords).not.toContain("for");
    expect(intent.keywords).not.toContain("my");
  });
});

describe("intentChips", () => {
  it("renders one chip per detected facet", async () => {
    const intent = await parseIntent("silk saree from Tamil Nadu under $100");
    const chips = intentChips(intent);
    const labels = chips.map((c) => c.label);
    expect(labels).toContain("textiles");
    expect(labels).toContain("Tamil Nadu");
    expect(labels).toContain("under $100");
  });

  it("returns no chips for empty intent", async () => {
    const intent = await parseIntent("");
    expect(intentChips(intent)).toHaveLength(0);
  });
});
