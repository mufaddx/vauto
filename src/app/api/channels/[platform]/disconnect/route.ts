import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db";
import { workspaceIdFor } from "@/lib/workspace";

export async function POST(
  request: Request,
  context: { params: Promise<{ platform: string }> },
) {
  const session = await readSession();
  if (!session) {
    return NextResponse.redirect(new URL("/login?next=%2Fapp%2Fchannels", request.url));
  }
  const { platform: raw } = await context.params;
  if (raw !== "instagram" && raw !== "facebook") {
    return NextResponse.redirect(new URL("/app/channels?error=platform", request.url));
  }

  const prisma = getPrisma();
  if (prisma) {
    const workspaceId = await workspaceIdFor(prisma, session);
    if (workspaceId) {
      // Clear the stored token as well as the status, so a disconnect really
      // removes our ability to act on the account.
      await prisma.channel.updateMany({
        where: {
          workspaceId,
          platform: raw === "instagram" ? "INSTAGRAM" : "FACEBOOK",
        },
        data: { status: "DISCONNECTED", tokenEncrypted: null, webhookStatus: null },
      });
    }
  }

  return NextResponse.redirect(new URL(`/app/channels/${raw}?disconnected=1`, request.url), 303);
}
