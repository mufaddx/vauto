import { describe, expect, it } from "vitest";
import { detectIntents, DEFAULT_ALIAS_SETS } from "@/lib/engines/keywords";
import { RuleBasedResponseEngine } from "@/lib/engines/response-engine";

const defs = Object.entries(DEFAULT_ALIAS_SETS).map(([intentKey, aliases]) => ({
  intentKey,
  keyword: aliases[0] ?? intentKey,
  aliases,
  fuzzy: true,
}));

describe("keyword engine", () => {
  it("matches aliases and multi-intent comments", () => {
    const intents = detectIntents("Price aur location bhejo", defs);
    expect(intents.map((i) => i.intentKey)).toEqual(
      expect.arrayContaining(["price", "location"]),
    );
  });

  it("matches simple spelling variation", () => {
    const intents = detectIntents("adress please", defs);
    expect(intents.some((i) => i.intentKey === "address" || i.intentKey === "location")).toBe(
      true,
    );
  });
});

describe("rule-based response engine", () => {
  it("prefers campaign information over global", async () => {
    const engine = new RuleBasedResponseEngine();
    const result = await engine.compose({
      comment: "Price?",
      username: "Rahul",
      campaignName: "Green Valley",
      triggerMode: "KEYWORD",
      keywordDefinitions: defs,
      campaign: { price: "₹45 Lakh" },
      globalBusiness: { price: "₹10 Lakh" },
      businessInformationActive: true,
    });
    expect(result.shouldReply).toBe(true);
    expect(result.message).toContain("₹45 Lakh");
    expect(result.message).not.toContain("₹10 Lakh");
  });

  it("does not use inactive global business information", async () => {
    const engine = new RuleBasedResponseEngine();
    const result = await engine.compose({
      comment: "location?",
      triggerMode: "KEYWORD",
      keywordDefinitions: defs,
      globalBusiness: { location: "Delhi" },
      businessInformationActive: false,
    });
    expect(result.shouldReply).toBe(false);
  });
});
