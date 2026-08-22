import { NextResponse } from "next/server";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { getPrisma, publicDbError } from "@/lib/db";
import { safeNextPath } from "@/lib/auth/redirects";
import { respondToForm } from "@/lib/auth/form-errors";

export async function POST(request: Request) {
  const limit = await rateLimit(clientKey(request, "login"), 10, 15 * 60 * 1000);
  if (!limit.ok) {
    return respondToForm(request, "/login", {
      code: "throttled",
      title: "Too many attempts",
      reason: "This IP address made too many requests in a short window.",
      action: "Wait a few minutes and try again.",
      status: 429,
    });
  }

  const form = await request.formData();
  const email = String(form.get("email") ?? "").toLowerCase().trim();
  const password = String(form.get("password") ?? "");
  const next = safeNextPath(form.get("next"), "/app");
  const prisma = getPrisma();

  // Without a database there is nothing to authenticate against. Signing a
  // session here would let any credentials in, so only development may bypass.
  if (!prisma) {
    if (process.env.APP_ENV === "development" || process.env.NODE_ENV === "development") {
      const token = await createSessionToken({
        sub: "local-dev",
        email: email || "dev@vidlix.local",
        firstName: "there",
        role: "USER",
      });
      await setSessionCookie(token);
      return NextResponse.redirect(new URL(next, request.url), 303);
    }
    return respondToForm(request, "/login", {
      code: "db_unavailable",
      title: "Login is unavailable",
      reason: "This deployment has no database connection configured.",
      action: "Set DATABASE_URL and DIRECT_URL, then check /api/health.",
      status: 503,
    });
  }

  let user;
  try {
    user = await prisma.user.findUnique({ where: { email } });
  } catch (error) {
    console.error("[auth:login] failed", error);
    const hint = publicDbError(error);
    return respondToForm(request, "/login", {
      code: `db_${hint}`,
      title: "Login could not be completed",
      reason: "The database could not be reached.",
      action: `Open /api/health and confirm database is true. Hint: ${hint}`,
      status: 503,
    });
  }

  if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
    return respondToForm(request, "/login", {
      code: "credentials",
      title: "Login could not be completed",
      reason: "The email or password did not match.",
      action: "Retry or reset your password.",
      status: 401,
    });
  }

  const token = await createSessionToken({
    sub: user.id,
    email: user.email,
    firstName: user.firstName,
    role: user.role,
  });
  await setSessionCookie(token);
  return NextResponse.redirect(new URL(next, request.url), 303);
}
