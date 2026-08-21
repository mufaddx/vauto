import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createOAuthState,
  facebookAuthUrl,
  facebookLoginConfigured,
  googleAuthUrl,
  googleConfigured,
  hashNonce,
  stateCookieName,
  type OAuthIntent,
  type OAuthProvider,
} from "@/lib/auth/oauth";

function providerFrom(params: { provider: string }): OAuthProvider | null {
  if (params.provider === "google" || params.provider === "facebook") {
    return params.provider;
  }
  return null;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider: raw } = await context.params;
  const provider = providerFrom({ provider: raw });
  const intent = new URL(request.url).searchParams.get("intent") === "signup" ? "signup" : "login";
  if (!provider) {
    return NextResponse.redirect(new URL(`/login?error=oauth_provider`, request.url));
  }
  if (provider === "google" && !googleConfigured()) {
    return NextResponse.redirect(
      new URL(`/${intent === "signup" ? "signup" : "login"}?error=google_not_configured`, request.url),
    );
  }
  if (provider === "facebook" && !facebookLoginConfigured()) {
    return NextResponse.redirect(
      new URL(`/${intent === "signup" ? "signup" : "login"}?error=facebook_not_configured`, request.url),
    );
  }

  const { payload, nonce } = createOAuthState(intent as OAuthIntent);
  const jar = await cookies();
  jar.set(stateCookieName(), hashNonce(nonce), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.APP_ENV === "production",
    path: "/",
    maxAge: 600,
  });

  const location = provider === "google" ? googleAuthUrl(payload) : facebookAuthUrl(payload);
  return NextResponse.redirect(location);
}
