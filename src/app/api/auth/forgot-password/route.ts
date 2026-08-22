import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { appOrigin } from "@/lib/auth/oauth";
import { createResetToken, resetTokenExpiry } from "@/lib/auth/reset-tokens";
import { mailConfigured, sendMail } from "@/lib/mail";

/** Always the same response, so this endpoint cannot enumerate accounts. */
function genericResponse(request: Request) {
  return NextResponse.redirect(new URL("/forgot-password?sent=1", request.url), 303);
}

export async function POST(request: Request) {
  const limit = await rateLimit(clientKey(request, "forgot-password"), 5, 15 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      {
        title: "Too many attempts",
        reason: "This IP address requested too many reset links.",
        action: "Wait a few minutes and try again.",
      },
      { status: 429 },
    );
  }

  const form = await request.formData();
  const email = String(form.get("email") ?? "").toLowerCase().trim();
  if (!email) return genericResponse(request);

  const prisma = getPrisma();
  if (!prisma) return genericResponse(request);

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return genericResponse(request);

    // Invalidate any outstanding tokens before issuing a new one.
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const { token, tokenHash } = createResetToken();
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt: resetTokenExpiry() },
    });

    const link = `${appOrigin()}/reset-password?token=${token}`;
    await sendMail({
      to: user.email,
      subject: "Reset your VIDLIX password",
      text: [
        `Hi ${user.firstName},`,
        "",
        "Use the link below to set a new password. It expires in 60 minutes.",
        link,
        "",
        "If you did not request this, you can ignore this email.",
      ].join("\n"),
    });

    if (!mailConfigured()) {
      console.info("[forgot-password] mail is not configured; reset link:", link);
    }
  } catch (error) {
    console.error("[forgot-password] failed", error);
  }

  return genericResponse(request);
}
