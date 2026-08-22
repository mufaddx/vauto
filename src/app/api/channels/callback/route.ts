import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readSession } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db";
import { workspaceIdFor } from "@/lib/workspace";
import { hashNonce, resolveAppOrigin } from "@/lib/auth/oauth";
import { encryptSecret } from "@/lib/crypto";
import {
  exchangeMetaCode,
  instagramProfile,
  listPages,
  longLivedToken,
} from "@/lib/meta/client";
import { CHANNEL_STATE_COOKIE } from "@/app/api/channels/[platform]/connect/route";

function parseState(value: string | null) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString()) as {
      platform?: string;
      nonce?: string;
    };
    if (parsed.platform !== "instagram" && parsed.platform !== "facebook") return null;
    if (!parsed.nonce) return null;
    return { platform: parsed.platform, nonce: parsed.nonce };
  } catch {
    return null;
  }
}

function fail(request: Request, platform: string, reason: string) {
  return NextResponse.redirect(
    new URL(`/app/channels/${platform}?error=${encodeURIComponent(reason)}`, request.url),
  );
}

export async function GET(request: Request) {
  const session = await readSession();
  if (!session) {
    return NextResponse.redirect(new URL("/login?next=%2Fapp%2Fchannels", request.url));
  }

  const url = new URL(request.url);
  const state = parseState(url.searchParams.get("state"));
  const jar = await cookies();
  const expected = jar.get(CHANNEL_STATE_COOKIE)?.value;
  jar.delete(CHANNEL_STATE_COOKIE);

  if (!state) return fail(request, "instagram", "state");
  if (url.searchParams.get("error")) return fail(request, state.platform, "cancelled");
  if (!expected || expected !== hashNonce(state.nonce)) {
    return fail(request, state.platform, "state");
  }

  const code = url.searchParams.get("code");
  if (!code) return fail(request, state.platform, "code");

  const prisma = getPrisma();
  if (!prisma) return fail(request, state.platform, "database");

  const workspaceId = await workspaceIdFor(prisma, session);
  if (!workspaceId) return fail(request, state.platform, "workspace");

  try {
    const shortLived = await exchangeMetaCode(
      code,
      `${resolveAppOrigin(request)}/api/channels/callback`,
    );
    const userToken = await longLivedToken(shortLived);
    const pages = await listPages(userToken);

    if (pages.length === 0) {
      return fail(request, state.platform, "no_pages");
    }

    let connected = 0;
    for (const page of pages) {
      if (state.platform === "facebook") {
        await prisma.channel.upsert({
          where: {
            workspaceId_platform_externalId: {
              workspaceId,
              platform: "FACEBOOK",
              externalId: page.id,
            },
          },
          create: {
            workspaceId,
            platform: "FACEBOOK",
            status: "CONNECTED",
            externalId: page.id,
            displayName: page.name,
            username: page.name,
            accountType: "page",
            permissions: page.tasks ?? [],
            tokenEncrypted: encryptSecret(page.access_token),
            lastSyncedAt: new Date(),
          },
          update: {
            status: "CONNECTED",
            displayName: page.name,
            permissions: page.tasks ?? [],
            tokenEncrypted: encryptSecret(page.access_token),
            lastSyncedAt: new Date(),
          },
        });
        connected += 1;
        continue;
      }

      const igId = page.instagram_business_account?.id;
      if (!igId) continue;
      const profile = await instagramProfile(igId, page.access_token);
      await prisma.channel.upsert({
        where: {
          workspaceId_platform_externalId: {
            workspaceId,
            platform: "INSTAGRAM",
            externalId: igId,
          },
        },
        create: {
          workspaceId,
          platform: "INSTAGRAM",
          status: "CONNECTED",
          externalId: igId,
          displayName: profile?.name ?? page.name,
          username: profile?.username ?? null,
          profileImageUrl: profile?.profile_picture_url ?? null,
          accountType: "business",
          permissions: page.tasks ?? [],
          tokenEncrypted: encryptSecret(page.access_token),
          lastSyncedAt: new Date(),
        },
        update: {
          status: "CONNECTED",
          displayName: profile?.name ?? page.name,
          username: profile?.username ?? null,
          profileImageUrl: profile?.profile_picture_url ?? null,
          permissions: page.tasks ?? [],
          tokenEncrypted: encryptSecret(page.access_token),
          lastSyncedAt: new Date(),
        },
      });
      connected += 1;
    }

    if (connected === 0) {
      return fail(request, state.platform, "no_instagram_business_account");
    }

    return NextResponse.redirect(
      new URL(`/app/channels/${state.platform}?connected=${connected}`, request.url),
    );
  } catch (error) {
    console.error("[channels:callback] failed", error);
    return fail(request, state.platform, "exchange_failed");
  }
}
