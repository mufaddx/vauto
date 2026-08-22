import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPrisma } from "@/lib/db";
import { createSessionToken, setSessionCookie, type SessionRole } from "@/lib/auth/session";
import { ensureWorkspace } from "@/lib/workspace";
import {
  exchangeFacebookCode,
  exchangeGoogleCode,
  hashNonce,
  parseOAuthState,
  resolveAppOrigin,
  stateCookieName,
  type OAuthProfile,
  type OAuthProvider,
} from "@/lib/auth/oauth";

function providerFrom(value: string): OAuthProvider | null {
  if (value === "google" || value === "facebook") return value;
  return null;
}

async function upsertUser(profile: OAuthProfile) {
  const prisma = getPrisma();
  if (!prisma) {
    return {
      id: `oauth-${profile.provider}-${profile.providerAccountId}`,
      email: profile.email,
      firstName: profile.firstName,
      role: "USER" as SessionRole,
      workspaceId: undefined as string | undefined,
      isNew: true,
    };
  }

  const existingLink = await prisma.oAuthAccount.findUnique({
    where: {
      provider_providerAccountId: {
        provider: profile.provider,
        providerAccountId: profile.providerAccountId,
      },
    },
    include: { user: true },
  });
  if (existingLink) {
    const workspaceId = await ensureWorkspace(prisma, existingLink.user);
    return { ...existingLink.user, workspaceId, isNew: false };
  }

  const byEmail = await prisma.user.findUnique({ where: { email: profile.email } });
  const user =
    byEmail ??
    (await prisma.user.create({
      data: {
        email: profile.email,
        firstName: profile.firstName,
        emailVerified: new Date(),
      },
    }));

  await prisma.oAuthAccount.create({
    data: {
      userId: user.id,
      provider: profile.provider,
      providerAccountId: profile.providerAccountId,
    },
  });

  const workspaceId = await ensureWorkspace(prisma, user);
  return { ...user, workspaceId, isNew: !byEmail };
}

export async function GET(
  request: Request,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider: raw } = await context.params;
  const provider = providerFrom(raw);
  const url = new URL(request.url);
  const failPath = "/login";

  if (!provider) {
    return NextResponse.redirect(new URL(`${failPath}?error=oauth_provider`, request.url));
  }
  if (url.searchParams.get("error")) {
    return NextResponse.redirect(new URL(`${failPath}?error=oauth_cancelled`, request.url));
  }

  const code = url.searchParams.get("code");
  const state = parseOAuthState(url.searchParams.get("state"));
  const jar = await cookies();
  const expected = jar.get(stateCookieName())?.value;
  jar.delete(stateCookieName());

  if (!code || !state || !expected || expected !== hashNonce(state.nonce)) {
    return NextResponse.redirect(new URL(`${failPath}?error=oauth_state`, request.url));
  }

  try {
    const profile =
      provider === "google"
        ? await exchangeGoogleCode(code, state.origin ?? resolveAppOrigin(request))
        : await exchangeFacebookCode(code, state.origin ?? resolveAppOrigin(request));
    const user = await upsertUser(profile);
    const token = await createSessionToken({
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      role: (user.role ?? "USER") as SessionRole,
      workspaceId: user.workspaceId,
    });
    await setSessionCookie(token);
    const next = user.isNew ? "/onboarding" : "/app";
    return NextResponse.redirect(new URL(next, request.url));
  } catch (error) {
    const message = error instanceof Error ? error.message : "oauth_failed";
    const encoded = encodeURIComponent(message);
    return NextResponse.redirect(new URL(`${failPath}?error=${encoded}`, request.url));
  }
}
