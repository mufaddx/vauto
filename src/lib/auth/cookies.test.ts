import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { secureCookies } from "@/lib/auth/cookies";

const original = { node: process.env.NODE_ENV, app: process.env.APP_ENV };

describe("secureCookies", () => {
  beforeEach(() => {
    delete (process.env as Record<string, string | undefined>).NODE_ENV;
    delete process.env.APP_ENV;
  });
  afterEach(() => {
    (process.env as Record<string, string | undefined>).NODE_ENV = original.node;
    if (original.app === undefined) delete process.env.APP_ENV;
    else process.env.APP_ENV = original.app;
  });

  it("is on when APP_ENV is an empty string", () => {
    // This is the production state that silently dropped the Secure flag.
    process.env.APP_ENV = "";
    expect(secureCookies()).toBe(true);
  });

  it("is on when nothing is configured at all", () => {
    expect(secureCookies()).toBe(true);
  });

  it("is on in production and staging", () => {
    process.env.APP_ENV = "production";
    expect(secureCookies()).toBe(true);
    process.env.APP_ENV = "staging";
    expect(secureCookies()).toBe(true);
  });

  it("is off only for local development", () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";
    expect(secureCookies()).toBe(false);

    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.APP_ENV = "development";
    expect(secureCookies()).toBe(false);
  });
});
