import { NextResponse } from "next/server";
import { getPrisma, publicDbError } from "@/lib/db";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { createSessionToken, setSessionCookie, type SessionRole } from "@/lib/auth/session";
import { safeNextPath } from "@/lib/auth/redirects";
import { ensureWorkspace } from "@/lib/workspace";
import {
  firstNameFromEmail,
  isPlausibleEmail,
  normalizeEmail,
  normalizeOtpInput,
  otpMatches,
  OTP_LENGTH,
  OTP_MAX_ATTEMPTS,
} from "@/lib/auth/otp";

function retry(request: Request, email: string, next: string, error: string) {
  const url = new URL("/login/code", request.url);
  url.searchParams.set("email", email);
  url.searchParams.set("error", error);
  if (next !== "/app") url.searchParams.set("next", next);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  const form = await request.formData();
  const email = normalizeEmail(String(form.get("email") ?? ""));
  const code = normalizeOtpInput(String(form.get("code") ?? ""));
  const next = safeNextPath(form.get("next"), "/app");

  if (!isPlausibleEmail(email)) return retry(request, email, next, "email");

  const limit = await rateLimit(clientKey(request, "otp-verify"), 20, 15 * 60 * 1000);
  if (!limit.ok) return retry(request, email, next, "throttled");
  if (code.length !== OTP_LENGTH) return retry(request, email, next, "code");

  const prisma = getPrisma();
  if (!prisma) return retry(request, email, next, "unavailable");

  try {
    const record = await prisma.emailOtp.findFirst({
      where: { email, consumedAt: null },
      orderBy: { createdAt: "desc" },
    });

    if (!record || record.expiresAt < new Date()) {
      return retry(request, email, next, "expired");
    }

    // Burn the code after too many wrong guesses rather than allowing an
    // unlimited walk through a six digit space.
    if (record.attempts + 1 >= OTP_MAX_ATTEMPTS) {
      await prisma.emailOtp.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 }, consumedAt: new Date() },
      });
      if (!otpMatches(email, code, record.codeHash)) {
        return retry(request, email, next, "attempts");
      }
    } else if (!otpMatches(email, code, record.codeHash)) {
      await prisma.emailOtp.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      return retry(request, email, next, "code");
    } else {
      await prisma.emailOtp.update({
        where: { id: record.id },
        data: { consumedAt: new Date() },
      });
    }

    // A verified code proves control of the inbox, so it both logs in and
    // signs up. The address is marked verified because that is what was tested.
    const existing = await prisma.user.findUnique({ where: { email } });
    const user =
      existing ??
      (await prisma.user.create({
        data: {
          email,
          firstName: firstNameFromEmail(email),
          emailVerified: new Date(),
        },
      }));

    if (existing && !existing.emailVerified) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    }

    const workspaceId = await ensureWorkspace(prisma, user);
    await setSessionCookie(
      await createSessionToken({
        sub: user.id,
        email: user.email,
        firstName: user.firstName,
        role: user.role as SessionRole,
        workspaceId,
      }),
    );

    return NextResponse.redirect(new URL(existing ? next : "/onboarding", request.url), 303);
  } catch (error) {
    console.error("[otp:verify] failed", error);
    return retry(request, email, next, `db_${publicDbError(error)}`);
  }
}
