import { Worker, type Job } from "bullmq";
import IORedis from "ioredis";
import { queueNames, getDeadLetterQueue } from "../src/lib/queues";
import { getPrisma } from "../src/lib/db";
import { extractCommentEvents } from "../src/lib/meta/events";
import { processCommentEvent } from "../src/lib/automations/process-comment";

const WEBHOOK_CONCURRENCY = Number(process.env.WORKER_CONCURRENCY ?? 5);

/**
 * Loads the stored webhook payload, turns it into comment events and runs each
 * one through the automation pipeline. Throwing lets BullMQ retry; anything we
 * do not want retried is recorded and returned normally.
 */
async function handleWebhookJob(job: Job<{ eventId: string }>) {
  const prisma = getPrisma();
  if (!prisma) {
    throw new Error("DATABASE_URL is not configured; cannot process webhook events.");
  }

  const { eventId } = job.data;
  const event = await prisma.webhookEvent.findUnique({ where: { eventId } });
  if (!event) {
    return { skipped: "unknown-event" };
  }
  if (event.status === "SUCCEEDED") {
    return { skipped: "already-processed" };
  }

  await prisma.webhookEvent.update({
    where: { eventId },
    data: { status: "PROCESSING", attempts: { increment: 1 } },
  });

  try {
    const comments = extractCommentEvents(event.payload);
    const results = [];

    for (const comment of comments) {
      const outcome = await processCommentEvent(prisma, comment);
      results.push({ commentId: comment.commentId, ...outcome });
      await job.log(`${comment.commentId}: ${outcome.reason}`);
    }

    await prisma.webhookEvent.update({
      where: { eventId },
      data: { status: "SUCCEEDED", processedAt: new Date(), error: null },
    });

    return { comments: comments.length, results };
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "unknown";
    await prisma.webhookEvent.update({
      where: { eventId },
      data: { status: "FAILED", processedAt: new Date(), error: message },
    });
    throw error;
  }
}

async function main() {
  const url = process.env.REDIS_URL;
  if (!url) {
    console.error("REDIS_URL is required for the worker process.");
    process.exit(1);
  }
  const connection = new IORedis(url, { maxRetriesPerRequest: null });
  const deadLetter = getDeadLetterQueue();

  const webhookWorker = new Worker(queueNames.webhooks, handleWebhookJob, {
    connection,
    concurrency: WEBHOOK_CONCURRENCY,
  });

  webhookWorker.on("failed", async (job, error) => {
    if (!job) return;
    console.error(`[worker] webhook job ${job.id} failed:`, error.message);
    // Only after every retry is exhausted does the event become dead.
    if (job.attemptsMade >= (job.opts.attempts ?? 1)) {
      const prisma = getPrisma();
      if (prisma) {
        await prisma.webhookEvent
          .update({
            where: { eventId: job.data.eventId },
            data: { status: "DEAD", error: error.message.slice(0, 500) },
          })
          .catch(() => undefined);
      }
      await deadLetter?.add("dead-webhook", {
        eventId: job.data.eventId,
        error: error.message,
      });
    }
  });

  const automationWorker = new Worker(
    queueNames.automations,
    async (job) => {
      await job.log(`Automation job ${job.id}`);
      return { ok: true, data: job.data };
    },
    { connection },
  );

  async function shutdown(signal: string) {
    console.log(`[worker] ${signal} received, draining…`);
    await Promise.all([webhookWorker.close(), automationWorker.close()]);
    await connection.quit();
    process.exit(0);
  }

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));

  console.log(`VIDLIX workers started (concurrency ${WEBHOOK_CONCURRENCY})`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
