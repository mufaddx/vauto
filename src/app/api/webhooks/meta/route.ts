import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { verifyMetaSignature } from "@/lib/meta/client";
import { getPrisma } from "@/lib/db";
import { getWebhookQueue } from "@/lib/queues";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }
  return NextResponse.json(
    {
      title: "Webhook verification failed",
      reason: "The verify token did not match this environment.",
      action: "Use the staging or production verify token for the matching Meta app.",
    },
    { status: 403 },
  );
}

export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  if (!process.env.META_APP_SECRET || !verifyMetaSignature(raw, signature)) {
    return NextResponse.json(
      {
        title: "Webhook was rejected",
        reason: "The Meta signature could not be verified.",
        action: "Confirm META_APP_SECRET for this environment.",
      },
      { status: 401 },
    );
  }

  const payload = JSON.parse(raw) as { entry?: Array<{ id?: string }>; object?: string };
  const eventId =
    request.headers.get("x-hub-event-id") ??
    createHash("sha256").update(raw).digest("hex");

  const prisma = getPrisma();
  if (prisma) {
    const existing = await prisma.webhookEvent.findUnique({ where: { eventId } });
    if (existing) {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    await prisma.webhookEvent.create({
      data: {
        eventId,
        platform: payload.object ?? "meta",
        accountId: payload.entry?.[0]?.id,
        eventType: "meta.event",
        status: "QUEUED",
        payloadHash: createHash("sha256").update(raw).digest("hex"),
      },
    });
  }

  const queue = getWebhookQueue();
  if (queue) {
    await queue.add("meta-event", { eventId }, { jobId: eventId });
  }

  return NextResponse.json({ ok: true });
}
