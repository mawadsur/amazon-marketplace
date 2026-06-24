import { describe, expect, it } from "vitest";
import {
  coerceIntent,
  relaxationSuggestion,
  removableChips,
  emptyIntent,
  type SearchIntent,
  type RemovableChip,
} from "@/lib/concierge";

function intent(partial: Partial<SearchIntent>): SearchIntent {
  return { ...emptyIntent(), ...partial };
}

describe("coerceIntent", () => {
  it("returns a valid empty-ish intent for null", () => {
    // null is not an object → coerceIntent short-circuits to null.
    expect(coerceIntent(null)).toBeNull();
  });

  it("returns a valid empty-ish intent for garbage (non-object) input", () => {
    expect(coerceIntent("garbage")).toBeNull();
    expect(coerceIntent(42)).toBeNull();
    expect(coerceIntent(undefined)).toBeNull();
  });

  it("coerces an object with junk fields into an empty-ish intent (arrays empty, prices null)", () => {
    const out = coerceIntent({
      categories: "not-an-array",
      regions: 123,
      priceMaxUsdCents: "free",
      priceMinUsdCents: {},
      keywords: null,
      context: 99,
      rawQuery: 7,
    });
    expect(out).not.toBeNull();
    expect(out!.categories).toEqual([]);
    expect(out!.regions).toEqual([]);
    expect(out!.keywords).toEqual([]);
    expect(out!.priceMaxUsdCents).toBeNull();
    expect(out!.priceMinUsdCents).toBeNull();
    expect(out!.context).toBeNull();
    expect(out!.rawQuery).toBe("");
    expect(out!.aiAssisted).toBe(false);
  });

  it("preserves valid categories, regions, prices, keywords, context", () => {
    const out = coerceIntent({
      categories: ["textiles", "jewelry"],
      regions: ["Maharashtra"],
      priceMaxUsdCents: 20000,
      priceMinUsdCents: 5000,
      keywords: ["silk", "saree"],
      context: "wedding",
      rawQuery: "silk saree",
      aiAssisted: true,
    });
    expect(out).not.toBeNull();
    expect(out!.categories).toEqual(["textiles", "jewelry"]);
    expect(out!.regions).toEqual(["Maharashtra"]);
    expect(out!.priceMaxUsdCents).toBe(20000);
    expect(out!.priceMinUsdCents).toBe(5000);
    expect(out!.keywords).toEqual(["silk", "saree"]);
    expect(out!.context).toBe("wedding");
    expect(out!.rawQuery).toBe("silk saree");
    expect(out!.aiAssisted).toBe(true);
  });
});

describe("relaxationSuggestion", () => {
  it("returns null for an empty chip array", () => {
    expect(relaxationSuggestion([])).toBeNull();
  });

  it("picks priceMax first when present (over region/category/keyword)", () => {
    const chips = removableChips(
      intent({
        categories: ["textiles"],
        regions: ["Maharashtra"],
        keywords: ["silk"],
        priceMaxUsdCents: 5000,
      }),
    );
    const out = relaxationSuggestion(chips);
    expect(out).not.toBeNull();
    expect(out!.facet).toBe("priceMax");
  });

  it("falls through to keyword when no priceMax is present", () => {
    const chips = removableChips(
      intent({ categories: ["textiles"], regions: ["Maharashtra"], keywords: ["silk"] }),
    );
    const out = relaxationSuggestion(chips);
    expect(out).not.toBeNull();
    expect(out!.facet).toBe("keyword");
    expect(out!.value).toBe("silk");
  });

  it("falls through to region when no priceMax/keyword is present", () => {
    const chips = removableChips(intent({ categories: ["textiles"], regions: ["Maharashtra"] }));
    const out = relaxationSuggestion(chips);
    expect(out).not.toBeNull();
    expect(out!.facet).toBe("region");
    expect(out!.value).toBe("Maharashtra");
  });

  it("falls through to category when only a category chip remains", () => {
    const chips = removableChips(intent({ categories: ["textiles"] }));
    const out = relaxationSuggestion(chips);
    expect(out).not.toBeNull();
    expect(out!.facet).toBe("category");
    expect(out!.value).toBe("textiles");
  });

  it("honours the full priority order down to priceMin and context", () => {
    // No priceMax/keyword/region/category → next is priceMin, then context.
    const priceMinChips = removableChips(intent({ priceMinUsdCents: 5000, context: "wedding" }));
    expect(relaxationSuggestion(priceMinChips)!.facet).toBe("priceMin");

    const contextOnly: RemovableChip[] = removableChips(intent({ context: "wedding" }));
    expect(relaxationSuggestion(contextOnly)!.facet).toBe("context");
  });
});
