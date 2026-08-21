import { Worker } from "bullmq";
import IORedis from "ioredis";
import { queueNames } from "../src/lib/queues";
import { createResponseEngine } from "../src/lib/engines";

async function main() {
  const url = process.env.REDIS_URL;
  if (!url) {
    console.error("REDIS_URL is required for the worker process.");
    process.exit(1);
  }
  const connection = new IORedis(url, { maxRetriesPerRequest: null });
  const engine = createResponseEngine();

  new Worker(
    queueNames.webhooks,
    async (job) => {
      await job.log(`Processing webhook ${job.data.eventId}`);
      return { engine: engine.constructor.name };
    },
    { connection },
  );

  new Worker(
    queueNames.automations,
    async (job) => {
      await job.log(`Automation job ${job.id}`);
      return { ok: true, data: job.data };
    },
    { connection },
  );

  console.log("VIDLIX workers started");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
