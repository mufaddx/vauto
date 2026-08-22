import type { PrismaClient } from "@prisma/client";
import { getPrisma } from "@/lib/db";
import { requireSession, type SessionPayload } from "@/lib/auth/session";
import { ensureWorkspace, workspaceIdFor } from "@/lib/workspace";

export type WorkspaceContext = {
  prisma: PrismaClient;
  workspaceId: string;
  session: SessionPayload;
};

/**
 * Thrown when the app is running without a database. Pages catch this and
 * render a configuration notice instead of crashing.
 */
export class WorkspaceUnavailableError extends Error {
  constructor(readonly hint: "database" | "workspace") {
    super(
      hint === "database"
        ? "This deployment has no database connection configured."
        : "This account has no workspace yet.",
    );
    this.name = "WorkspaceUnavailableError";
  }
}

/** For server actions and route handlers: always resolves or throws. */
export async function requireWorkspace(returnTo?: string): Promise<WorkspaceContext> {
  const session = await requireSession(returnTo);
  const prisma = getPrisma();
  if (!prisma) throw new WorkspaceUnavailableError("database");

  // Cheap activity signal for the admin console; failures must not block a page.
  void prisma.user
    .update({ where: { id: session.sub }, data: { lastActiveAt: new Date() } })
    .catch(() => undefined);

  let workspaceId = await workspaceIdFor(prisma, session);
  if (!workspaceId) {
    // A user can predate the workspace change, or arrive via an older session.
    workspaceId = await ensureWorkspace(prisma, {
      id: session.sub,
      firstName: session.firstName,
    });
  }
  return { prisma, workspaceId, session };
}

/** For pages that should degrade gracefully instead of throwing. */
export async function tryWorkspace(
  returnTo?: string,
): Promise<WorkspaceContext | null> {
  try {
    return await requireWorkspace(returnTo);
  } catch (error) {
    if (error instanceof WorkspaceUnavailableError) return null;
    throw error;
  }
}
