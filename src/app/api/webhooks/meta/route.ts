import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { verifyMetaSignature } from "@/lib/meta/client";
import { extractCommentEvents } from "@/lib/meta/events";
import { getPrisma } from "@/lib/db";
import { getWebhookQueue } from "@/lib/queues";

function safeTokenEquals(received: string, expected: string) {
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const expected = process.env.META_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && token && expected && safeTokenEquals(token, expected)) {
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

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    // A malformed body is not worth retrying, so acknowledge it.
    return NextResponse.json({ ok: true, ignored: "unparseable" });
  }

  const payloadHash = createHash("sha256").update(raw).digest("hex");
  const eventId = request.headers.get("x-hub-event-id") ?? payloadHash;
  const object = (payload as { object?: string }).object ?? "meta";
  const entryId = (payload as { entry?: Array<{ id?: string }> }).entry?.[0]?.id ?? null;
  const comments = extractCommentEvents(payload);

  const prisma = getPrisma();
  if (prisma) {
    const existing = await prisma.webhookEvent.findUnique({ where: { eventId } });
    if (existing) {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    // The payload is stored so the worker can process (and replay) the event.
    await prisma.webhookEvent.create({
      data: {
        eventId,
        platform: object,
        accountId: entryId,
        eventType: comments.length > 0 ? "meta.comment" : "meta.event",
        status: "QUEUED",
        payloadHash,
        payload: payload as object,
      },
    });
    // Attribute the event to a workspace when the account is known to us.
    if (entryId) {
      const channel = await prisma.channel.findFirst({
        where: { externalId: entryId },
        select: { workspaceId: true },
      });
      if (channel) {
        await prisma.webhookEvent.update({
          where: { eventId },
          data: { workspaceId: channel.workspaceId },
        });
        await prisma.channel.updateMany({
          where: { externalId: entryId },
          data: { lastEventAt: new Date() },
        });
      }
    }
  }

  const queue = getWebhookQueue();
  if (queue) {
    await queue.add("meta-event", { eventId }, { jobId: eventId });
  } else if (prisma) {
    // Without Redis there is no worker to pick this up. Mark it clearly
    // rather than leaving it stuck in QUEUED forever.
    await prisma.webhookEvent.update({
      where: { eventId },
      data: {
        status: "RECEIVED",
        error: "REDIS_URL is not configured, so no worker processed this event.",
      },
    });
  }

  return NextResponse.json({ ok: true, comments: comments.length });
}
