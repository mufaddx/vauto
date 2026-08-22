import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { getPrisma } from "@/lib/db";
import {
  fetchRazorpayOrder,
  isPurchasablePlan,
  periodEndFor,
  verifyRazorpayWebhook,
} from "@/lib/payments/razorpay";

type RazorpayEntity = {
  id?: string;
  amount?: number;
  currency?: string;
  order_id?: string;
  status?: string;
  notes?: Record<string, string>;
  current_end?: number;
};

type RazorpayWebhook = {
  event?: string;
  payload?: {
    payment?: { entity?: RazorpayEntity };
    subscription?: { entity?: RazorpayEntity };
  };
};

function planFrom(notes: Record<string, string> | undefined) {
  const code = notes?.planCode ?? "STARTER_MONTHLY";
  return isPurchasablePlan(code) ? code : "STARTER_MONTHLY";
}

export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!process.env.RAZORPAY_WEBHOOK_SECRET || !verifyRazorpayWebhook(raw, signature)) {
    return NextResponse.json(
      {
        title: "Payment webhook was rejected",
        reason: "The Razorpay signature could not be verified.",
        action: "Confirm RAZORPAY_WEBHOOK_SECRET for this environment.",
      },
      { status: 401 },
    );
  }

  const body = JSON.parse(raw) as RazorpayWebhook;
  const event = body.event ?? "unknown";
  const prisma = getPrisma();

  // Always acknowledge; Razorpay retries only on non-2xx and we must not loop
  // forever on an event we cannot store.
  if (!prisma) return NextResponse.json({ ok: true, persisted: false });

  const eventId =
    request.headers.get("x-razorpay-event-id") ??
    createHash("sha256").update(raw).digest("hex");

  // Idempotency: the same event id must never be applied twice.
  const seen = await prisma.webhookEvent.findUnique({ where: { eventId } });
  if (seen) return NextResponse.json({ ok: true, duplicate: true });

  const payment = body.payload?.payment?.entity;
  const subscriptionEntity = body.payload?.subscription?.entity;
  let notes = payment?.notes ?? subscriptionEntity?.notes;

  // Payment entities do not always carry the order notes, and those notes are
  // the only server-set record of which workspace and plan this payment is for.
  if (!notes?.workspaceId && payment?.order_id) {
    try {
      const order = await fetchRazorpayOrder(payment.order_id);
      notes = order.notes ?? notes;
    } catch (error) {
      console.error("[webhooks:razorpay] order lookup failed", error);
    }
  }
  const workspaceId = notes?.workspaceId ?? null;

  await prisma.webhookEvent.create({
    data: {
      eventId,
      platform: "razorpay",
      accountId: payment?.id ?? subscriptionEntity?.id ?? null,
      eventType: event,
      status: "PROCESSING",
      workspaceId,
      payloadHash: createHash("sha256").update(raw).digest("hex"),
    },
  });

  try {
    if (workspaceId) {
      const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
      if (!workspace) throw new Error(`Unknown workspace ${workspaceId}`);

      if (event === "payment.captured" && payment?.id) {
        const existing = await prisma.invoice.findFirst({
          where: { workspaceId, razorpayPaymentId: payment.id },
        });
        if (!existing) {
          await prisma.invoice.create({
            data: {
              workspaceId,
              razorpayPaymentId: payment.id,
              amountPaise: payment.amount ?? 0,
              currency: payment.currency ?? "INR",
              status: "paid",
            },
          });
        }
        const planCode = planFrom(notes);
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
      }

      if (event === "payment.failed" && payment?.id) {
        const existing = await prisma.invoice.findFirst({
          where: { workspaceId, razorpayPaymentId: payment.id },
        });
        if (!existing) {
          await prisma.invoice.create({
            data: {
              workspaceId,
              razorpayPaymentId: payment.id,
              amountPaise: payment.amount ?? 0,
              currency: payment.currency ?? "INR",
              status: "failed",
            },
          });
        }
      }

      if (event === "subscription.cancelled" || event === "subscription.completed") {
        const subscription = await prisma.subscription.findFirst({ where: { workspaceId } });
        if (subscription) {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              status: event === "subscription.cancelled" ? "CANCELLED" : "EXPIRED",
              cancelAtPeriodEnd: true,
            },
          });
        }
      }

      if (event === "subscription.halted" || event === "payment.dispute.created") {
        const subscription = await prisma.subscription.findFirst({ where: { workspaceId } });
        if (subscription) {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: "PAST_DUE" },
          });
        }
      }
    }

    await prisma.webhookEvent.update({
      where: { eventId },
      data: { status: "SUCCEEDED", processedAt: new Date() },
    });
  } catch (error) {
    console.error("[webhooks:razorpay] failed", error);
    await prisma.webhookEvent.update({
      where: { eventId },
      data: {
        status: "FAILED",
        processedAt: new Date(),
        error: error instanceof Error ? error.message.slice(0, 500) : "unknown",
      },
    });
  }

  return NextResponse.json({ ok: true });
}
