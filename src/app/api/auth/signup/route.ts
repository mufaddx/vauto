import { NextResponse } from "next/server";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { getPrisma, publicDbError } from "@/lib/db";
import { safeNextPath } from "@/lib/auth/redirects";
import { ensureWorkspace } from "@/lib/workspace";

export async function POST(request: Request) {
  const limit = await rateLimit(clientKey(request, "signup"), 5, 15 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      {
        title: "Too many attempts",
        reason: "This IP address made too many requests in a short window.",
        action: "Wait a few minutes and try again.",
      },
      { status: 429 },
    );
  }

  const form = await request.formData();
  const email = String(form.get("email") ?? "").toLowerCase().trim();
  const firstName = String(form.get("firstName") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const next = safeNextPath(form.get("next"), "/onboarding");
  if (!email || !firstName || password.length < 8) {
    return NextResponse.json(
      {
        title: "Account could not be created",
        reason: "Name, email, and an 8+ character password are required.",
        action: "Check the form and retry.",
      },
      { status: 400 },
    );
  }

  const prisma = getPrisma();
  try {
    if (prisma) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json(
          {
            title: "Account could not be created",
            reason: "An account with this email already exists.",
            action: "Login instead.",
          },
          { status: 409 },
        );
      }
      const user = await prisma.user.create({
        data: {
          email,
          firstName,
          passwordHash: await hashPassword(password),
        },
      });
      const workspaceId = await ensureWorkspace(prisma, user);
      const token = await createSessionToken({
        sub: user.id,
        email: user.email,
        firstName: user.firstName,
        role: user.role,
        workspaceId,
      });
      await setSessionCookie(token);
    } else if (
      process.env.APP_ENV === "development" ||
      process.env.NODE_ENV === "development"
    ) {
      const token = await createSessionToken({
        sub: "local-dev",
        email,
        firstName,
        role: "USER",
      });
      await setSessionCookie(token);
    } else {
      return NextResponse.json(
        {
          title: "Account could not be created",
          reason: "This deployment has no database connection configured.",
          action: "Set DATABASE_URL and DIRECT_URL, then check /api/health.",
        },
        { status: 503 },
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        title: "Account could not be created",
        reason: "The database could not be reached. Check DATABASE_URL and DIRECT_URL on this deployment.",
        action: "Open /api/health and confirm database is true. Hint: " + publicDbError(error),
      },
      { status: 503 },
    );
  }

  return NextResponse.redirect(new URL(next, request.url), 303);
}
