import { NextResponse } from "next/server";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { getPrisma } from "@/lib/db";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").toLowerCase().trim();
  const password = String(form.get("password") ?? "");
  const prisma = getPrisma();

  if (!prisma) {
    const token = await createSessionToken({
      sub: "local-dev",
      email,
      firstName: "there",
      role: "USER",
    });
    await setSessionCookie(token);
    return NextResponse.redirect(new URL("/app", request.url), 303);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json(
      {
        title: "Login could not be completed",
        reason: "The email or password did not match.",
        action: "Retry or reset your password.",
      },
      { status: 401 },
    );
  }

  const token = await createSessionToken({
    sub: user.id,
    email: user.email,
    firstName: user.firstName,
    role: user.role,
  });
  await setSessionCookie(token);
  return NextResponse.redirect(new URL("/app", request.url), 303);
}
