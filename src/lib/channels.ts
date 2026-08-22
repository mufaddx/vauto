import { getPrisma } from "@/lib/db";
import { workspaceIdFor } from "@/lib/workspace";
import type { SessionPayload } from "@/lib/auth/session";
import type { ChannelView } from "@/components/app/channel-detail";

function toPermissions(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  return [];
}

/** Loads the first connected channel of a platform for the session's workspace. */
export async function loadChannel(
  session: SessionPayload,
  platform: "INSTAGRAM" | "FACEBOOK",
): Promise<ChannelView | null> {
  const prisma = getPrisma();
  if (!prisma) return null;
  const workspaceId = await workspaceIdFor(prisma, session);
  if (!workspaceId) return null;

  const channel = await prisma.channel.findFirst({
    where: { workspaceId, platform },
    orderBy: { updatedAt: "desc" },
  });
  if (!channel) return null;

  return {
    status: channel.status,
    displayName: channel.displayName,
    username: channel.username,
    accountType: channel.accountType,
    permissions: toPermissions(channel.permissions),
    webhookStatus: channel.webhookStatus,
    lastEventAt: channel.lastEventAt,
    lastSyncedAt: channel.lastSyncedAt,
  };
}

/** Summary used by the channels index page. */
export async function loadChannelSummary(session: SessionPayload) {
  const [instagram, facebook] = await Promise.all([
    loadChannel(session, "INSTAGRAM"),
    loadChannel(session, "FACEBOOK"),
  ]);
  return { instagram, facebook };
}
