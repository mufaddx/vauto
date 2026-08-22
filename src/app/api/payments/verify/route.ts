import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db";
import { workspaceIdFor } from "@/lib/workspace";
import {
  fetchRazorpayOrder,
  isPurchasablePlan,
  periodEndFor,
  verifyRazorpaySignature,
} from "@/lib/payments/razorpay";

function rejected(reason: string, status = 400) {
  return NextResponse.json(
    {
      title: "Payment could not be verified",
      reason,
      action: "Contact support with your payment id.",
    },
    { status },
  );
}

/**
 * Called by the browser right after Razorpay Checkout succeeds. The signature
 * proves the payment belongs to our order; everything about *what was bought*
 * is read back from Razorpay, never from the request body. The webhook remains
 * the authoritative source — this only gives the user immediate feedback.
 */
export async function POST(request: Request) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json(
      { title: "Not signed in", reason: "A session is required.", action: "Log in and retry." },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    orderId?: string;
    paymentId?: string;
    signature?: string;
  };

  const { orderId, paymentId, signature } = body;
  if (!orderId || !paymentId || !signature) {
    return rejected("The confirmation payload was incomplete.");
  }

  if (!verifyRazorpaySignature({ orderId, paymentId, signature })) {
    return rejected("The Razorpay signature did not match this order.");
  }

  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ ok: true, persisted: false });

  const sessionWorkspaceId = await workspaceIdFor(prisma, session);
  if (!sessionWorkspaceId) return NextResponse.json({ ok: true, persisted: false });

  let order;
  try {
    order = await fetchRazorpayOrder(orderId);
  } catch (error) {
    console.error("[payments:verify] order lookup failed", error);
    return rejected("The order could not be confirmed with Razorpay.", 502);
  }

  // The workspace and plan come from the notes we set when creating the order.
  const orderWorkspaceId = order.notes?.workspaceId;
  const orderPlanCode = order.notes?.planCode ?? "";

  if (!orderWorkspaceId || orderWorkspaceId !== sessionWorkspaceId) {
    return rejected("This payment does not belong to your workspace.", 403);
  }
  if (!isPurchasablePlan(orderPlanCode)) {
    return rejected("The order is not linked to a purchasable plan.");
  }
  if (order.status !== "paid") {
    return rejected("Razorpay has not marked this order as paid yet.", 409);
  }

  const workspaceId = orderWorkspaceId;
  const planCode = orderPlanCode;
  // Amount comes from the order Razorpay actually charged.
  const amountPaise = order.amount_paid ?? order.amount;

  // Idempotent: the webhook may have already recorded this payment.
  const existing = await prisma.invoice.findFirst({
    where: { workspaceId, razorpayPaymentId: paymentId },
  });
  if (!existing) {
    await prisma.invoice.create({
      data: {
        workspaceId,
        razorpayPaymentId: paymentId,
        amountPaise,
        currency: order.currency ?? "INR",
        status: "paid",
      },
    });
  }

  const subscription = await prisma.subscription.findFirst({ where: { workspaceId } });
  const data = {
    planCode,
    status: "ACTIVE" as const,
    currentPeriodEnd: periodEndFor(planCode),
    cancelAtPeriodEnd: false,
  };
  if (subscription) {
    await prisma.subscription.update({ where: { id: subscription.id }, data });
  } else {
    await prisma.subscription.create({ data: { workspaceId, ...data } });
  }

  return NextResponse.json({ ok: true, persisted: true, planCode });
}
