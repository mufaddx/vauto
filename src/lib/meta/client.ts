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

export function metaConfigured() {
  return Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET);
}

export type MetaPage = {
  id: string;
  name: string;
  access_token: string;
  tasks?: string[];
  instagram_business_account?: { id: string };
};

/** Exchanges an OAuth code for a short-lived user access token. */
export async function exchangeMetaCode(code: string, redirectUri: string) {
  const env = getEnv();
  const appId = assertServerSecret("META_APP_ID", process.env.META_APP_ID);
  const appSecret = assertServerSecret("META_APP_SECRET", process.env.META_APP_SECRET);
  const url = new URL(graphUrl("/oauth/access_token"));
  url.searchParams.set("client_id", appId);
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("code", code);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Meta token exchange failed (${response.status})`);
  }
  const body = (await response.json()) as { access_token?: string };
  if (!body.access_token) throw new Error("Meta did not return an access token");
  void env;
  return body.access_token;
}

/** Upgrades a short-lived token to the ~60 day long-lived token. */
export async function longLivedToken(shortLivedToken: string) {
  const appId = assertServerSecret("META_APP_ID", process.env.META_APP_ID);
  const appSecret = assertServerSecret("META_APP_SECRET", process.env.META_APP_SECRET);
  const url = new URL(graphUrl("/oauth/access_token"));
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("fb_exchange_token", shortLivedToken);
  const response = await fetch(url);
  if (!response.ok) return shortLivedToken;
  const body = (await response.json()) as { access_token?: string };
  return body.access_token ?? shortLivedToken;
}

/** Pages the user administers, with their linked Instagram business account. */
export async function listPages(userAccessToken: string): Promise<MetaPage[]> {
  const url = new URL(graphUrl("/me/accounts"));
  url.searchParams.set(
    "fields",
    "id,name,access_token,tasks,instagram_business_account{id}",
  );
  url.searchParams.set("access_token", userAccessToken);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Meta pages could not be loaded (${response.status})`);
  }
  const body = (await response.json()) as { data?: MetaPage[] };
  return body.data ?? [];
}

export async function instagramProfile(igUserId: string, pageAccessToken: string) {
  const url = new URL(graphUrl(`/${igUserId}`));
  url.searchParams.set("fields", "id,username,name,profile_picture_url");
  url.searchParams.set("access_token", pageAccessToken);
  const response = await fetch(url);
  if (!response.ok) return null;
  return (await response.json()) as {
    id: string;
    username?: string;
    name?: string;
    profile_picture_url?: string;
  };
}

/** Posts a private reply to a comment (Instagram + Facebook both support this). */
export async function sendPrivateReply(params: {
  commentId: string;
  message: string;
  pageAccessToken: string;
}) {
  const url = graphUrl("/me/messages");
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { comment_id: params.commentId },
      message: { text: params.message },
      access_token: params.pageAccessToken,
    }),
  });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Private reply failed (${response.status}): ${body.slice(0, 200)}`);
  }
  return JSON.parse(body) as { message_id?: string; recipient_id?: string };
}

/** Public reply on the comment thread itself. */
export async function replyToComment(params: {
  commentId: string;
  message: string;
  pageAccessToken: string;
}) {
  const url = graphUrl(`/${params.commentId}/replies`);
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: params.message,
      access_token: params.pageAccessToken,
    }),
  });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Comment reply failed (${response.status}): ${body.slice(0, 200)}`);
  }
  return JSON.parse(body) as { id?: string };
}
