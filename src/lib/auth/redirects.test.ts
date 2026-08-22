import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/auth/redirects";

describe("safeNextPath", () => {
  it("keeps same-origin absolute paths", () => {
    expect(safeNextPath("/app/channels", "/app")).toBe("/app/channels");
  });

  it("falls back for open-redirect attempts", () => {
    expect(safeNextPath("https://evil.example.com", "/app")).toBe("/app");
    expect(safeNextPath("//evil.example.com", "/app")).toBe("/app");
    expect(safeNextPath("\\\\evil.example.com", "/app")).toBe("/app");
    expect(safeNextPath("/app\\..\\evil", "/app")).toBe("/app");
  });

  it("falls back for empty or non-string input", () => {
    expect(safeNextPath("", "/app")).toBe("/app");
    expect(safeNextPath("   ", "/app")).toBe("/app");
    expect(safeNextPath(undefined, "/app")).toBe("/app");
    expect(safeNextPath(42, "/app")).toBe("/app");
  });
});
