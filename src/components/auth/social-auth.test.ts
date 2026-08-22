import { describe, expect, it } from "vitest";
import { oauthErrorMessage } from "@/components/auth/social-auth";

describe("oauthErrorMessage", () => {
  it("returns null when there is no error", () => {
    expect(oauthErrorMessage(undefined)).toBeNull();
    expect(oauthErrorMessage("")).toBeNull();
  });

  it("explains known configuration problems", () => {
    expect(oauthErrorMessage("google_not_configured")).toMatch(/GOOGLE_CLIENT_ID/);
    expect(oauthErrorMessage("app_url_not_configured")).toMatch(/APP_URL/);
  });

  it("translates database hints into a readable sentence", () => {
    expect(oauthErrorMessage("oauth_database_ssl-untrusted-chain")).toMatch(
      /DATABASE_CA_CERT/,
    );
    expect(oauthErrorMessage("oauth_database_timeout")).toMatch(/did not respond/);
  });

  it("stays generic for an unrecognised database hint", () => {
    expect(oauthErrorMessage("oauth_database_whatever")).toMatch(
      /database could not be reached/,
    );
  });

  it("never echoes an arbitrary value back into the page", () => {
    // The callback used to put raw Prisma errors straight into the query string.
    const raw = "Invalid `prisma.oAuthAccount.findUnique()` invocation: secret-host:5432";
    expect(oauthErrorMessage(raw)).toBe("The social login could not be completed.");
    expect(oauthErrorMessage("<img src=x onerror=alert(1)>")).not.toContain("<img");
  });
});
