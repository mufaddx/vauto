import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  allowedOAuthOrigin,
  appOrigin,
  assertAbsoluteOrigin,
  facebookAuthUrl,
  googleAuthUrl,
  oauthCallbackUrl,
  resolveAppOrigin,
} from "@/lib/auth/oauth";

const ENV_KEYS = [
  "APP_URL",
  "MARKETING_URL",
  "VERCEL_URL",
  "META_GRAPH_VERSION",
  "GOOGLE_CLIENT_ID",
  "FACEBOOK_LOGIN_APP_ID",
  "META_APP_ID",
];

describe("origin resolution", () => {
  beforeEach(() => {
    for (const key of ENV_KEYS) delete process.env[key];
  });
  afterEach(() => {
    for (const key of ENV_KEYS) delete process.env[key];
  });

  it("treats an empty APP_URL as unset instead of producing an empty origin", () => {
    // A hosting dashboard stores "" happily, and `??` does not catch it.
    process.env.APP_URL = "";
    process.env.MARKETING_URL = "   ";
    expect(appOrigin()).toBe("https://vidlix.in");
  });

  it("prefers APP_URL, then MARKETING_URL, then VERCEL_URL", () => {
    process.env.MARKETING_URL = "https://vidlix.in";
    expect(appOrigin()).toBe("https://vidlix.in");

    process.env.APP_URL = "https://app.vidlix.in/some/path";
    expect(appOrigin()).toBe("https://app.vidlix.in");

    delete process.env.APP_URL;
    delete process.env.MARKETING_URL;
    process.env.VERCEL_URL = "vauto-preview.vercel.app";
    expect(appOrigin()).toBe("https://vauto-preview.vercel.app");
  });

  it("falls back to the configured origin when the request URL is unusable", () => {
    process.env.APP_URL = "https://vidlix.in";
    expect(resolveAppOrigin({ url: "not-a-url" } as Request)).toBe("https://vidlix.in");
  });

  it("uses the request origin when it is an allowed host", () => {
    const request = new Request("https://vidlix.in/api/auth/oauth/google?intent=login");
    expect(resolveAppOrigin(request)).toBe("https://vidlix.in");
  });
});

describe("assertAbsoluteOrigin", () => {
  it("rejects an empty origin", () => {
    expect(() => assertAbsoluteOrigin("")).toThrow(/not an absolute origin/);
  });

  it("rejects a bare path", () => {
    expect(() => assertAbsoluteOrigin("/api/auth")).toThrow(/not an absolute origin/);
  });

  it("rejects plain http on a real host", () => {
    expect(() => assertAbsoluteOrigin("http://vidlix.in")).toThrow();
  });

  it("accepts https and localhost", () => {
    expect(assertAbsoluteOrigin("https://vidlix.in")).toBe("https://vidlix.in");
    expect(assertAbsoluteOrigin("http://localhost:3000")).toBe("http://localhost:3000");
  });
});

describe("callback URLs", () => {
  beforeEach(() => {
    for (const key of ENV_KEYS) delete process.env[key];
  });
  afterEach(() => {
    for (const key of ENV_KEYS) delete process.env[key];
  });

  it("is always absolute", () => {
    expect(oauthCallbackUrl("google", "https://vidlix.in")).toBe(
      "https://vidlix.in/api/auth/oauth/google/callback",
    );
  });

  it("refuses to build a relative redirect_uri", () => {
    // This is exactly what Meta rejects with "Can't load URL".
    expect(() => oauthCallbackUrl("facebook", "")).toThrow(/not an absolute origin/);
  });
});

describe("provider authorize URLs", () => {
  beforeEach(() => {
    for (const key of ENV_KEYS) delete process.env[key];
    process.env.GOOGLE_CLIENT_ID = "google-client";
    process.env.FACEBOOK_LOGIN_APP_ID = "fb-app";
  });
  afterEach(() => {
    for (const key of ENV_KEYS) delete process.env[key];
  });

  it("sends Google an absolute redirect_uri", () => {
    const url = new URL(googleAuthUrl("state-1", "https://vidlix.in"));
    expect(url.searchParams.get("redirect_uri")).toBe(
      "https://vidlix.in/api/auth/oauth/google/callback",
    );
  });

  it("falls back to a real Graph version when META_GRAPH_VERSION is empty", () => {
    process.env.META_GRAPH_VERSION = "";
    const url = new URL(facebookAuthUrl("state-1", "https://vidlix.in"));
    // An empty version produced facebook.com//dialog/oauth in production.
    expect(url.pathname).toBe("/v21.0/dialog/oauth");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "https://vidlix.in/api/auth/oauth/facebook/callback",
    );
  });

  it("honours an explicit Graph version", () => {
    process.env.META_GRAPH_VERSION = "v23.0";
    const url = new URL(facebookAuthUrl("state-1", "https://vidlix.in"));
    expect(url.pathname).toBe("/v23.0/dialog/oauth");
  });
});

describe("allowedOAuthOrigin", () => {
  it("allows the product hosts and previews", () => {
    expect(allowedOAuthOrigin("https://vidlix.in")).toBe(true);
    expect(allowedOAuthOrigin("https://www.vidlix.in")).toBe(true);
    expect(allowedOAuthOrigin("https://vauto-abc.vercel.app")).toBe(true);
    expect(allowedOAuthOrigin("http://localhost:3000")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(allowedOAuthOrigin("https://evil.example.com")).toBe(false);
    expect(allowedOAuthOrigin("http://vidlix.in")).toBe(false);
    expect(allowedOAuthOrigin("")).toBe(false);
  });
});
