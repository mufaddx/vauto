import { describe, expect, it } from "vitest";
import { z } from "zod";
import { lines, optionalText, readForm, requiredText, zodFieldErrors } from "@/lib/actions/shared";

describe("optionalText", () => {
  it("turns blank input into null", () => {
    expect(optionalText.parse("")).toBeNull();
    expect(optionalText.parse("   ")).toBeNull();
  });

  it("trims real values", () => {
    expect(optionalText.parse("  ₹45 Lakh  ")).toBe("₹45 Lakh");
  });

  it("accepts an explicit null", () => {
    expect(optionalText.parse(null)).toBeNull();
  });
});

describe("requiredText", () => {
  const schema = requiredText("Campaign name");

  it("rejects blank input with a readable message", () => {
    const result = schema.safeParse("   ");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Campaign name is required.");
    }
  });

  it("accepts and trims a real value", () => {
    expect(schema.parse("  Green Valley ")).toBe("Green Valley");
  });
});

describe("lines", () => {
  it("splits, trims, and drops blanks", () => {
    expect(lines("price\n  cost  \n\nrate\n")).toEqual(["price", "cost", "rate"]);
  });

  it("handles missing input", () => {
    expect(lines(undefined)).toEqual([]);
    expect(lines(null)).toEqual([]);
  });
});

describe("readForm", () => {
  it("keeps only string entries", () => {
    const form = new FormData();
    form.set("name", "Green Valley");
    form.set("file", new Blob(["x"]));
    expect(readForm(form)).toEqual({ name: "Green Valley" });
  });
});

describe("zodFieldErrors", () => {
  it("maps the first issue per field", () => {
    const schema = z.object({
      name: z.string().min(1, "Name is required."),
      email: z.string().min(1, "Email is required."),
    });
    const result = schema.safeParse({ name: "", email: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(zodFieldErrors(result.error)).toEqual({
        name: "Name is required.",
        email: "Email is required.",
      });
    }
  });
});
