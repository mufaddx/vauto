import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { readSession } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db";
import { workspaceIdFor } from "@/lib/workspace";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import {
  createRazorpayOrder,
  isPurchasablePlan,
  plans,
  razorpayConfigured,
  razorpayPublicKeyId,
} from "@/lib/payments/razorpay";

export async function POST(request: Request) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json(
      { title: "Not signed in", reason: "A session is required to start checkout.", action: "Log in and retry." },
      { status: 401 },
    );
  }

  const limit = await rateLimit(clientKey(request, "order"), 20, 15 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { title: "Too many attempts", reason: "Too many checkout attempts.", action: "Wait and retry." },
      { status: 429 },
    );
  }

  if (!razorpayConfigured()) {
    return NextResponse.json(
      {
        title: "Checkout is not available",
        reason: "Razorpay keys are not configured for this environment.",
        action: "Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
      },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as { planCode?: string };
  const planCode = body.planCode ?? "STARTER_MONTHLY";
  if (!isPurchasablePlan(planCode)) {
    return NextResponse.json(
      {
        title: "Plan is not available",
        reason: "That plan cannot be purchased yet.",
        action: "Choose the Starter plan.",
      },
      { status: 400 },
    );
  }

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json(
      {
        title: "Checkout is not available",
        reason: "This deployment has no database connection configured.",
        action: "Set DATABASE_URL and check /api/health.",
      },
      { status: 503 },
    );
  }

  const workspaceId = await workspaceIdFor(prisma, session);
  if (!workspaceId) {
    return NextResponse.json(
      {
        title: "Checkout is not available",
        reason: "This account has no workspace yet.",
        action: "Complete onboarding first.",
      },
      { status: 409 },
    );
  }

  try {
    const order = await createRazorpayOrder({
      planCode,
      workspaceId,
      receipt: `vlx_${nanoid(12)}`,
    });
    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: razorpayPublicKeyId(),
      planCode,
      planLabel: plans[planCode].label,
    });
  } catch (error) {
    console.error("[payments:order] failed", error);
    return NextResponse.json(
      {
        title: "Checkout could not start",
        reason: "Razorpay did not accept the order request.",
        action: "Check the Razorpay keys and try again.",
      },
      { status: 502 },
    );
  }
}
