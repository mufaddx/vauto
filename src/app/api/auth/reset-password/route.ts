import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { hashPassword } from "@/lib/auth/password";
import { hashResetToken } from "@/lib/auth/reset-tokens";

function invalid(reason: string, status = 400) {
  return NextResponse.json(
    {
      title: "Password could not be reset",
      reason,
      action: "Request a new reset link from the forgot password page.",
    },
    { status },
  );
}

export async function POST(request: Request) {
  const limit = await rateLimit(clientKey(request, "reset-password"), 10, 15 * 60 * 1000);
  if (!limit.ok) return invalid("Too many attempts from this IP address.", 429);

  const form = await request.formData();
  const token = String(form.get("token") ?? "").trim();
  const password = String(form.get("password") ?? "");

  if (!token) return invalid("The reset link is missing its token.");
  if (password.length < 8) return invalid("The new password must be at least 8 characters.");

  const prisma = getPrisma();
  if (!prisma) {
    return invalid("This deployment has no database connection configured.", 503);
  }

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashResetToken(token) },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return invalid("This reset link is invalid or has already expired.");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash: await hashPassword(password) },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    // Any existing session rows for this user are no longer trustworthy.
    prisma.session.deleteMany({ where: { userId: record.userId } }),
  ]);

  return NextResponse.redirect(new URL("/login?reset=1", request.url), 303);
}
