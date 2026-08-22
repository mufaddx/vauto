import { createHash, randomBytes } from "node:crypto";

export type OAuthProvider = "google" | "facebook";
export type OAuthIntent = "login" | "signup";

const STATE_COOKIE = "vidlix_oauth_state";

export function allowedOAuthOrigin(origin: string) {
  try {
    const url = new URL(origin);
    const host = url.hostname;
    if (host === "localhost" || host.endsWith(".localhost")) {
      return url.protocol === "http:" || url.protocol === "https:";
    }
    if (url.protocol !== "https:") return false;
    return host === "vidlix.in" || host === "www.vidlix.in" || host.endsWith(".vercel.app");
  } catch {
    return false;
  }
}

export function resolveAppOrigin(request: Request) {
  const requestOrigin = new URL(request.url).origin;
  if (allowedOAuthOrigin(requestOrigin)) return requestOrigin;

  const fromEnv = (process.env.APP_URL || process.env.MARKETING_URL || "").trim();
  if (fromEnv) {
    try {
      const origin = new URL(fromEnv).origin;
      if (allowedOAuthOrigin(origin)) return origin;
    } catch {
      // fall through
    }
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "https://vidlix.in";
}

export function appOrigin() {
  const fromEnv = (process.env.APP_URL || process.env.MARKETING_URL || "").trim();
  if (fromEnv) {
    try {
      return new URL(fromEnv).origin;
    } catch {
      // fall through
    }
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "https://vidlix.in";
}

export function oauthCallbackUrl(provider: OAuthProvider, origin = appOrigin()) {
  return `${origin}/api/auth/oauth/${provider}/callback`;
}

export function createOAuthState(intent: OAuthIntent, origin: string) {
  const nonce = randomBytes(16).toString("hex");
  const payload = Buffer.from(JSON.stringify({ intent, nonce, origin })).toString("base64url");
  return { payload, nonce };
}

export function parseOAuthState(value: string | null) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString()) as {
      intent?: string;
      nonce?: string;
      origin?: string;
    };
    if (parsed.intent !== "login" && parsed.intent !== "signup") return null;
    if (!parsed.nonce) return null;
    const origin = parsed.origin && allowedOAuthOrigin(parsed.origin) ? parsed.origin : null;
    return { intent: parsed.intent as OAuthIntent, nonce: parsed.nonce, origin };
  } catch {
    return null;
  }
}

export function stateCookieName() {
  return STATE_COOKIE;
}

export function hashNonce(nonce: string) {
  return createHash("sha256").update(nonce).digest("hex");
}

export function googleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function facebookLoginConfigured() {
  return Boolean(
    (process.env.FACEBOOK_LOGIN_APP_ID || process.env.META_APP_ID) &&
      (process.env.FACEBOOK_LOGIN_APP_SECRET || process.env.META_APP_SECRET),
  );
}

export function facebookLoginCredentials() {
  return {
    appId: process.env.FACEBOOK_LOGIN_APP_ID || process.env.META_APP_ID || "",
    appSecret: process.env.FACEBOOK_LOGIN_APP_SECRET || process.env.META_APP_SECRET || "",
  };
}

export function googleAuthUrl(state: string, origin: string) {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID ?? "");
  url.searchParams.set("redirect_uri", oauthCallbackUrl("google", origin));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

export function facebookAuthUrl(state: string, origin: string) {
  const { appId } = facebookLoginCredentials();
  const version = process.env.META_GRAPH_VERSION ?? "v21.0";
  const url = new URL(`https://www.facebook.com/${version}/dialog/oauth`);
  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", oauthCallbackUrl("facebook", origin));
  url.searchParams.set("state", state);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "email,public_profile");
  return url.toString();
}

export type OAuthProfile = {
  provider: OAuthProvider;
  providerAccountId: string;
  email: string;
  firstName: string;
};

export async function exchangeGoogleCode(code: string, origin: string): Promise<OAuthProfile> {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    redirect_uri: oauthCallbackUrl("google", origin),
    grant_type: "authorization_code",
  });
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!tokenRes.ok) {
    throw new Error("Google token exchange failed");
  }
  const tokens = (await tokenRes.json()) as { access_token?: string };
  if (!tokens.access_token) throw new Error("Google did not return an access token");
  const profileRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!profileRes.ok) throw new Error("Google profile could not be loaded");
  const profile = (await profileRes.json()) as {
    sub?: string;
    email?: string;
    given_name?: string;
    name?: string;
  };
  if (!profile.sub || !profile.email) {
    throw new Error("Google did not provide an email address");
  }
  return {
    provider: "google",
    providerAccountId: profile.sub,
    email: profile.email.toLowerCase(),
    firstName: profile.given_name || profile.name?.split(" ")[0] || "there",
  };
}

export async function exchangeFacebookCode(code: string, origin: string): Promise<OAuthProfile> {
  const { appId, appSecret } = facebookLoginCredentials();
  const version = process.env.META_GRAPH_VERSION ?? "v21.0";
  const tokenUrl = new URL(`https://graph.facebook.com/${version}/oauth/access_token`);
  tokenUrl.searchParams.set("client_id", appId);
  tokenUrl.searchParams.set("client_secret", appSecret);
  tokenUrl.searchParams.set("redirect_uri", oauthCallbackUrl("facebook", origin));
  tokenUrl.searchParams.set("code", code);
  const tokenRes = await fetch(tokenUrl);
  if (!tokenRes.ok) throw new Error("Facebook token exchange failed");
  const tokens = (await tokenRes.json()) as { access_token?: string };
  if (!tokens.access_token) throw new Error("Facebook did not return an access token");
  const profileUrl = new URL(`https://graph.facebook.com/${version}/me`);
  profileUrl.searchParams.set("fields", "id,name,first_name,email");
  profileUrl.searchParams.set("access_token", tokens.access_token);
  const profileRes = await fetch(profileUrl);
  if (!profileRes.ok) throw new Error("Facebook profile could not be loaded");
  const profile = (await profileRes.json()) as {
    id?: string;
    email?: string;
    first_name?: string;
    name?: string;
  };
  if (!profile.id) throw new Error("Facebook did not return a user id");
  if (!profile.email) {
    throw new Error("Facebook did not share an email. Grant email permission and retry.");
  }
  return {
    provider: "facebook",
    providerAccountId: profile.id,
    email: profile.email.toLowerCase(),
    firstName: profile.first_name || profile.name?.split(" ")[0] || "there",
  };
}
