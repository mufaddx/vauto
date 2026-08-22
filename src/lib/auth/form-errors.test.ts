import { describe, expect, it } from "vitest";
import { authFormMessage, respondToForm, wantsHtml } from "@/lib/auth/form-errors";

const failure = {
  code: "db_connect",
  title: "Account could not be created",
  reason: "The database could not be reached.",
  action: "Open /api/health.",
  status: 503,
};

function htmlRequest() {
  return new Request("https://vidlix.in/api/auth/signup", {
    method: "POST",
    headers: { accept: "text/html,application/xhtml+xml" },
  });
}

function apiRequest() {
  return new Request("https://vidlix.in/api/auth/signup", {
    method: "POST",
    headers: { accept: "application/json" },
  });
}

describe("wantsHtml", () => {
  it("detects a browser form post", () => {
    expect(wantsHtml(htmlRequest())).toBe(true);
  });

  it("treats an API client as not wanting HTML", () => {
    expect(wantsHtml(apiRequest())).toBe(false);
    expect(wantsHtml(new Request("https://vidlix.in/x", { method: "POST" }))).toBe(false);
  });
});

describe("respondToForm", () => {
  it("sends a browser back to the form instead of a JSON page", () => {
    const response = respondToForm(htmlRequest(), "/signup", failure);
    expect(response.status).toBe(303);
    const location = new URL(response.headers.get("location") ?? "");
    expect(location.pathname).toBe("/signup");
    expect(location.searchParams.get("error")).toBe("db_connect");
  });

  it("carries extra parameters through", () => {
    const response = respondToForm(htmlRequest(), "/login", failure, { next: "/app/billing" });
    const location = new URL(response.headers.get("location") ?? "");
    expect(location.searchParams.get("next")).toBe("/app/billing");
  });

  it("omits empty extra parameters", () => {
    const response = respondToForm(htmlRequest(), "/login", failure, { next: "" });
    const location = new URL(response.headers.get("location") ?? "");
    expect(location.searchParams.has("next")).toBe(false);
  });

  it("still returns JSON with the original status for API clients", async () => {
    const response = respondToForm(apiRequest(), "/signup", failure);
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      title: failure.title,
      reason: failure.reason,
    });
  });
});

describe("authFormMessage", () => {
  it("explains the known codes", () => {
    expect(authFormMessage("exists")).toMatch(/already exists/);
    expect(authFormMessage("credentials")).toMatch(/did not match/);
    expect(authFormMessage("db_ssl-untrusted-chain")).toMatch(/DATABASE_CA_CERT/);
  });

  it("falls back for an unmapped database hint", () => {
    expect(authFormMessage("db_something_new")).toMatch(/api\/health/);
  });

  it("returns null for anything it does not own, so OAuth messages still win", () => {
    expect(authFormMessage(undefined)).toBeNull();
    expect(authFormMessage("oauth_state")).toBeNull();
  });
});
