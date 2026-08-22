import { NextResponse } from "next/server";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { getPrisma } from "@/lib/db";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").toLowerCase().trim();
  const firstName = String(form.get("firstName") ?? "").trim();
  const password = String(form.get("password") ?? "");
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
      const token = await createSessionToken({
        sub: user.id,
        email: user.email,
        firstName: user.firstName,
        role: "USER",
      });
      await setSessionCookie(token);
    } else {
      const token = await createSessionToken({
        sub: "local-dev",
        email,
        firstName,
        role: "USER",
      });
      await setSessionCookie(token);
    }
  } catch {
    return NextResponse.json(
      {
        title: "Account could not be created",
        reason: "The database could not be reached. Check DATABASE_URL on this deployment.",
        action: "Retry after the database connection is saved and the app is redeployed.",
      },
      { status: 503 },
    );
  }

  return NextResponse.redirect(new URL("/onboarding", request.url), 303);
}
