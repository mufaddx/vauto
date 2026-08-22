import { describe, expect, it } from "vitest";
import {
  createOtpCode,
  firstNameFromEmail,
  hashOtpCode,
  isPlausibleEmail,
  normalizeEmail,
  normalizeOtpInput,
  otpExpiry,
  otpMatches,
  OTP_LENGTH,
  OTP_TTL_MINUTES,
} from "@/lib/auth/otp";

describe("createOtpCode", () => {
  it("is always the configured number of digits", () => {
    for (let i = 0; i < 200; i += 1) {
      const code = createOtpCode();
      expect(code).toHaveLength(OTP_LENGTH);
      expect(code).toMatch(/^\d+$/);
    }
  });

  it("does not repeat itself in a short run", () => {
    const codes = new Set(Array.from({ length: 100 }, () => createOtpCode()));
    expect(codes.size).toBeGreaterThan(90);
  });
});

describe("hashOtpCode", () => {
  it("never stores the code itself", () => {
    const hash = hashOtpCode("user@example.com", "123456");
    expect(hash).not.toContain("123456");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("binds the code to one address", () => {
    // The same digits for a different email must not verify.
    expect(hashOtpCode("a@example.com", "123456")).not.toBe(
      hashOtpCode("b@example.com", "123456"),
    );
  });

  it("ignores address casing", () => {
    expect(hashOtpCode("User@Example.com", "123456")).toBe(
      hashOtpCode("user@example.com", "123456"),
    );
  });
});

describe("otpMatches", () => {
  const email = "user@example.com";
  const stored = hashOtpCode(email, "123456");

  it("accepts the right code", () => {
    expect(otpMatches(email, "123456", stored)).toBe(true);
  });

  it("rejects a wrong code", () => {
    expect(otpMatches(email, "123457", stored)).toBe(false);
  });

  it("rejects the right code for a different address", () => {
    expect(otpMatches("other@example.com", "123456", stored)).toBe(false);
  });

  it("rejects a malformed stored hash without throwing", () => {
    expect(otpMatches(email, "123456", "short")).toBe(false);
    expect(otpMatches(email, "123456", "")).toBe(false);
  });
});

describe("otpExpiry", () => {
  it("expires after the configured window", () => {
    const now = new Date("2026-08-22T10:00:00.000Z");
    expect(otpExpiry(now).toISOString()).toBe("2026-08-22T10:10:00.000Z");
    expect(OTP_TTL_MINUTES).toBe(10);
  });
});

describe("normalizeOtpInput", () => {
  it("keeps digits only and caps the length", () => {
    expect(normalizeOtpInput(" 123 456 ")).toBe("123456");
    expect(normalizeOtpInput("12-34-56")).toBe("123456");
    expect(normalizeOtpInput("1234567890")).toBe("123456");
    expect(normalizeOtpInput("abcdef")).toBe("");
  });
});

describe("normalizeEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeEmail("  User@Example.COM ")).toBe("user@example.com");
  });
});

describe("isPlausibleEmail", () => {
  it("accepts ordinary addresses", () => {
    expect(isPlausibleEmail("user@example.com")).toBe(true);
    expect(isPlausibleEmail("first.last+tag@sub.example.co.in")).toBe(true);
  });

  it("rejects obvious rubbish", () => {
    expect(isPlausibleEmail("")).toBe(false);
    expect(isPlausibleEmail("user")).toBe(false);
    expect(isPlausibleEmail("user@host")).toBe(false);
    expect(isPlausibleEmail("user @example.com")).toBe(false);
    expect(isPlausibleEmail(`${"a".repeat(250)}@example.com`)).toBe(false);
  });
});

describe("firstNameFromEmail", () => {
  it("derives a usable display name", () => {
    expect(firstNameFromEmail("mursalim@vidlix.in")).toBe("Mursalim");
    expect(firstNameFromEmail("first.last@example.com")).toBe("First");
    expect(firstNameFromEmail("md_mursalim@example.com")).toBe("Md");
  });

  it("falls back when there is nothing to use", () => {
    expect(firstNameFromEmail("@example.com")).toBe("there");
  });
});
