import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readSession } from "@/lib/auth/session";
import { hashNonce, resolveAppOrigin } from "@/lib/auth/oauth";
import { randomBytes } from "node:crypto";
import {
  buildOAuthUrl,
  FACEBOOK_SCOPES,
  INSTAGRAM_SCOPES,
  metaConfigured,
} from "@/lib/meta/client";
import { encryptionConfigured } from "@/lib/crypto";

export const CHANNEL_STATE_COOKIE = "vidlix_channel_state";

function platformFrom(value: string) {
  if (value === "instagram" || value === "facebook") return value;
  return null;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ platform: string }> },
) {
  const session = await readSession();
  if (!session) {
    return NextResponse.redirect(new URL("/login?next=%2Fapp%2Fchannels", request.url));
  }

  const { platform: raw } = await context.params;
  const platform = platformFrom(raw);
  if (!platform) {
    return NextResponse.redirect(new URL("/app/channels?error=platform", request.url));
  }
  if (!metaConfigured()) {
    return NextResponse.redirect(
      new URL(`/app/channels/${platform}?error=meta_not_configured`, request.url),
    );
  }
  if (!encryptionConfigured()) {
    return NextResponse.redirect(
      new URL(`/app/channels/${platform}?error=encryption_not_configured`, request.url),
    );
  }

  const origin = resolveAppOrigin(request);
  const nonce = randomBytes(16).toString("hex");
  const state = Buffer.from(JSON.stringify({ platform, nonce })).toString("base64url");

  const jar = await cookies();
  jar.set(CHANNEL_STATE_COOKIE, hashNonce(nonce), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.APP_ENV === "production",
    path: "/",
    maxAge: 600,
  });

  return NextResponse.redirect(
    buildOAuthUrl({
      redirectUri: `${origin}/api/channels/callback`,
      state,
      scopes: platform === "instagram" ? INSTAGRAM_SCOPES : FACEBOOK_SCOPES,
    }),
  );
}
