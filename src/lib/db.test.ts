import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { databaseTlsMode, databaseTlsVerified, publicDbError } from "@/lib/db";

describe("publicDbError", () => {
  it("names an untrusted certificate chain distinctly", () => {
    // This is the Supabase pooler failure we hit in production.
    expect(
      publicDbError(new Error("Error opening a TLS connection: self-signed certificate in certificate chain")),
    ).toBe("ssl-untrusted-chain");
  });

  it("classifies the common failures", () => {
    expect(publicDbError(new Error("password authentication failed"))).toBe("auth");
    expect(publicDbError(new Error("connection timeout expired"))).toBe("timeout");
    expect(publicDbError(new Error("getaddrinfo ENOTFOUND db.host"))).toBe("dns");
    expect(publicDbError(new Error("prepared statement s0 already exists"))).toBe("pgbouncer");
    expect(publicDbError(new Error("could not connect to server"))).toBe("connect");
  });

  it("prefers a driver error code when present", () => {
    expect(publicDbError({ code: "28P01" })).toBe("28P01");
  });

  it("falls back to a generic hint", () => {
    expect(publicDbError(new Error("something odd"))).toBe("query");
    expect(publicDbError(null)).toBe("query");
  });

  it("never returns the original message", () => {
    const secret = "postgresql://user:hunter2@db.internal:5432/postgres";
    expect(publicDbError(new Error(`could not connect to ${secret}`))).not.toContain("hunter2");
  });
});

describe("database TLS posture", () => {
  beforeEach(() => {
    delete process.env.DATABASE_CA_CERT;
    delete process.env.DATABASE_TLS_INSECURE;
  });
  afterEach(() => {
    delete process.env.DATABASE_CA_CERT;
    delete process.env.DATABASE_TLS_INSECURE;
  });

  it("is false without a CA certificate", () => {
    expect(databaseTlsVerified()).toBe(false);
    process.env.DATABASE_CA_CERT = "   ";
    expect(databaseTlsVerified()).toBe(false);
  });

  it("is true once a CA certificate is supplied", () => {
    process.env.DATABASE_CA_CERT = "-----BEGIN CERTIFICATE-----";
    expect(databaseTlsVerified()).toBe(true);
  });

  it("reports unconfigured rather than silently skipping verification", () => {
    expect(databaseTlsMode()).toBe("unconfigured");
  });

  it("reports insecure only on an explicit opt-in", () => {
    process.env.DATABASE_TLS_INSECURE = "true";
    expect(databaseTlsMode()).toBe("insecure");
  });

  it("does not accept a truthy-looking value as the opt-in", () => {
    // Only "true" counts, so "1" or "yes" cannot quietly disable verification.
    for (const value of ["1", "yes", "TRUE", "on", ""]) {
      process.env.DATABASE_TLS_INSECURE = value;
      expect(databaseTlsMode()).toBe("unconfigured");
    }
  });

  it("tolerates surrounding whitespace on the opt-in", () => {
    process.env.DATABASE_TLS_INSECURE = "  true  ";
    expect(databaseTlsMode()).toBe("insecure");
  });

  it("prefers verification even if the insecure flag is also set", () => {
    process.env.DATABASE_CA_CERT = "-----BEGIN CERTIFICATE-----";
    process.env.DATABASE_TLS_INSECURE = "true";
    expect(databaseTlsMode()).toBe("verified");
  });
});
