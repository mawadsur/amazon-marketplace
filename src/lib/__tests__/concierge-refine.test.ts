import { describe, expect, it } from "vitest";
import {
  mergeIntentDelta,
  removeFacet,
  emptyIntent,
  type SearchIntent,
} from "@/lib/concierge";

function intent(partial: Partial<SearchIntent>): SearchIntent {
  return { ...emptyIntent(), ...partial };
}

describe("mergeIntentDelta", () => {
  it("'cheaper' lowers the price ceiling", () => {
    const prior = intent({ priceMaxUsdCents: 20000, keywords: ["saree"] });
    const { intent: next } = mergeIntentDelta(prior, "now show cheaper ones");
    expect(next.priceMaxUsdCents).not.toBeNull();
    expect(next.priceMaxUsdCents!).toBeLessThan(20000);
  });

  it("'more expensive' raises the price floor", () => {
    const prior = intent({ priceMinUsdCents: 5000 });
    const { intent: next } = mergeIntentDelta(prior, "show me more expensive ones");
    expect(next.priceMinUsdCents!).toBeGreaterThan(5000);
  });

  it("'only silk' sets the material and drops conflicting materials", () => {
    const prior = intent({ keywords: ["cotton", "saree"] });
    const { intent: next } = mergeIntentDelta(prior, "only silk");
    expect(next.keywords).toContain("silk");
    expect(next.keywords).not.toContain("cotton");
  });

  it("maps a city to its stored region ('from Mumbai' → Maharashtra)", () => {
    const { intent: next } = mergeIntentDelta(emptyIntent(), "from Mumbai");
    expect(next.regions).toContain("Maharashtra");
  });

  it("switches category with 'instead'", () => {
    const prior = intent({ categories: ["textiles"] });
    const { intent: next } = mergeIntentDelta(prior, "show jewelry instead");
    expect(next.categories).toEqual(["jewelry"]);
  });

  it("'start over' resets the intent", () => {
    const prior = intent({ categories: ["textiles"], regions: ["Maharashtra"] });
    const { intent: next, reset } = mergeIntentDelta(prior, "start over");
    expect(reset).toBe(true);
    expect(next.categories).toHaveLength(0);
    expect(next.regions).toHaveLength(0);
  });

  it("'any price' removes both price bounds", () => {
    const prior = intent({ priceMinUsdCents: 5000, priceMaxUsdCents: 20000 });
    const { intent: next } = mergeIntentDelta(prior, "any price is fine");
    expect(next.priceMaxUsdCents).toBeNull();
    expect(next.priceMinUsdCents).toBeNull();
  });
});

describe("removeFacet", () => {
  it("removes a region", () => {
    const prior = intent({ regions: ["Maharashtra", "Gujarat"] });
    const next = removeFacet(prior, "region", "Maharashtra");
    expect(next.regions).toEqual(["Gujarat"]);
  });

  it("clears the price ceiling", () => {
    const prior = intent({ priceMaxUsdCents: 12000 });
    const next = removeFacet(prior, "priceMax", "");
    expect(next.priceMaxUsdCents).toBeNull();
  });

  it("removes a keyword", () => {
    const prior = intent({ keywords: ["silk", "saree"] });
    const next = removeFacet(prior, "keyword", "silk");
    expect(next.keywords).toEqual(["saree"]);
  });
});
