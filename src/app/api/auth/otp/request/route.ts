import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { sendMail, mailConfigured } from "@/lib/mail";
import {
  createOtpCode,
  hashOtpCode,
  isPlausibleEmail,
  normalizeEmail,
  otpExpiry,
  OTP_TTL_MINUTES,
} from "@/lib/auth/otp";
import { safeNextPath } from "@/lib/auth/redirects";

/**
 * Always lands on the same screen whether or not the email exists, so this
 * endpoint cannot be used to discover which addresses have accounts.
 */
function sent(request: Request, email: string, next: string) {
  const url = new URL("/login/code", request.url);
  url.searchParams.set("email", email);
  if (next !== "/app") url.searchParams.set("next", next);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  const form = await request.formData();
  const email = normalizeEmail(String(form.get("email") ?? ""));
  const next = safeNextPath(form.get("next"), "/app");

  if (!isPlausibleEmail(email)) {
    return NextResponse.json(
      {
        title: "Code could not be sent",
        reason: "That does not look like an email address.",
        action: "Check the address and try again.",
      },
      { status: 400 },
    );
  }

  // Two limits: one per address so a single inbox cannot be flooded, and one
  // per IP so a single client cannot spray many addresses.
  const perEmail = await rateLimit(`otp:email:${email}`, 5, 15 * 60 * 1000);
  const perIp = await rateLimit(clientKey(request, "otp"), 20, 15 * 60 * 1000);
  if (!perEmail.ok || !perIp.ok) {
    return NextResponse.json(
      {
        title: "Too many codes requested",
        reason: "Several codes were requested in a short window.",
        action: "Wait a few minutes and try again.",
      },
      { status: 429 },
    );
  }

  if (!mailConfigured()) {
    return NextResponse.json(
      {
        title: "Email sign-in is unavailable",
        reason: "This deployment has no mail provider configured.",
        action: "Set RESEND_API_KEY and MAIL_FROM, then try again.",
      },
      { status: 503 },
    );
  }

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json(
      {
        title: "Email sign-in is unavailable",
        reason: "This deployment has no database connection configured.",
        action: "Check /api/health.",
      },
      { status: 503 },
    );
  }

  const code = createOtpCode();

  // Any outstanding codes for this address stop working the moment a new one
  // is issued, so only the newest email is ever valid.
  await prisma.emailOtp.updateMany({
    where: { email, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  await prisma.emailOtp.create({
    data: { email, codeHash: hashOtpCode(email, code), expiresAt: otpExpiry() },
  });

  await sendMail({
    to: email,
    subject: `${code} is your VIDLIX sign-in code`,
    text: [
      `Your VIDLIX sign-in code is ${code}`,
      "",
      `It expires in ${OTP_TTL_MINUTES} minutes and can be used once.`,
      "",
      "If you did not request this, you can ignore this email.",
    ].join("\n"),
  });

  return sent(request, email, next);
}
