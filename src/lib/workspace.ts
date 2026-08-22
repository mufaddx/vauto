import type { PrismaClient } from "@prisma/client";

function slugify(input: string) {
  return (
    input
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32) || "workspace"
  );
}

/**
 * Every user needs exactly one owned workspace before any workspace-scoped
 * feature (channels, campaigns, billing) can store anything. Called on signup
 * and on first OAuth login.
 */
export async function ensureWorkspace(
  prisma: PrismaClient,
  user: { id: string; firstName: string },
) {
  const existing = await prisma.membership.findFirst({
    where: { userId: user.id },
    select: { workspaceId: true },
  });
  if (existing) return existing.workspaceId;

  const base = slugify(`${user.firstName}-workspace`);
  let slug = base;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const taken = await prisma.workspace.findUnique({ where: { slug } });
    if (!taken) break;
    slug = `${base}-${Math.random().toString(36).slice(2, 7)}`;
  }

  const workspace = await prisma.workspace.create({
    data: {
      name: `${user.firstName}'s workspace`,
      slug,
      memberships: { create: { userId: user.id, role: "owner" } },
    },
  });
  return workspace.id;
}

/** Resolves the workspace for a session, falling back to a DB lookup. */
export async function workspaceIdFor(
  prisma: PrismaClient,
  session: { sub: string; workspaceId?: string },
) {
  if (session.workspaceId) return session.workspaceId;
  const membership = await prisma.membership.findFirst({
    where: { userId: session.sub },
    select: { workspaceId: true },
  });
  return membership?.workspaceId ?? null;
}
