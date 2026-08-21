import { createHmac, timingSafeEqual } from "node:crypto";
import { assertServerSecret, getEnv } from "@/lib/env";

/**
 * Official Meta Graph helpers only. No scraping, cookies, or unofficial APIs.
 */
export function graphUrl(path: string) {
  const env = getEnv();
  const trimmed = path.startsWith("/") ? path : `/${path}`;
  return `https://graph.facebook.com/${env.META_GRAPH_VERSION}${trimmed}`;
}

export function verifyMetaSignature(rawBody: string, signatureHeader: string | null) {
  const secret = assertServerSecret("META_APP_SECRET", process.env.META_APP_SECRET);
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const received = signatureHeader.slice("sha256=".length);
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function buildOAuthUrl(params: {
  redirectUri: string;
  state: string;
  scopes: string[];
}) {
  const env = getEnv();
  const appId = assertServerSecret("META_APP_ID", env.META_APP_ID);
  const url = new URL("https://www.facebook.com/v21.0/dialog/oauth");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("state", params.state);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", params.scopes.join(","));
  return url.toString();
}

export const INSTAGRAM_SCOPES = [
  "instagram_business_basic",
  "instagram_business_manage_comments",
  "instagram_business_manage_messages",
];

export const FACEBOOK_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_metadata",
  "pages_messaging",
];
