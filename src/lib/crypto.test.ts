import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret, encryptionConfigured } from "@/lib/crypto";

const KEY = "a".repeat(64); // 32 bytes, hex encoded

describe("token encryption", () => {
  beforeEach(() => {
    process.env.ENCRYPTION_KEY = KEY;
  });
  afterEach(() => {
    delete process.env.ENCRYPTION_KEY;
  });

  it("round-trips a value", () => {
    const secret = "EAAG-page-access-token";
    expect(decryptSecret(encryptSecret(secret))).toBe(secret);
  });

  it("produces a different ciphertext each time", () => {
    expect(encryptSecret("same")).not.toBe(encryptSecret("same"));
  });

  it("rejects a tampered payload", () => {
    const encrypted = encryptSecret("token");
    const parts = encrypted.split(".");
    parts[3] = Buffer.from("tampered").toString("base64url");
    expect(() => decryptSecret(parts.join("."))).toThrow();
  });

  it("rejects a malformed payload", () => {
    expect(() => decryptSecret("not-encrypted")).toThrow(/expected format/);
  });

  it("refuses to encrypt without a key", () => {
    delete process.env.ENCRYPTION_KEY;
    expect(encryptionConfigured()).toBe(false);
    expect(() => encryptSecret("token")).toThrow(/ENCRYPTION_KEY/);
  });
});
