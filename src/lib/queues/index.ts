import { Queue, type JobsOptions } from "bullmq";
import IORedis from "ioredis";

const defaultJobOptions: JobsOptions = {
  attempts: 5,
  backoff: { type: "exponential", delay: 2000 },
  removeOnComplete: 1000,
  removeOnFail: 5000,
};

let connection: IORedis | null = null;

export function getRedis() {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  if (!connection) {
    connection = new IORedis(url, { maxRetriesPerRequest: null });
  }
  return connection;
}

export const queueNames = {
  webhooks: "vidlix-webhooks",
  automations: "vidlix-automations",
  deadLetter: "vidlix-dead-letter",
} as const;

export function getWebhookQueue() {
  const redis = getRedis();
  if (!redis) return null;
  return new Queue(queueNames.webhooks, { connection: redis, defaultJobOptions });
}

export function getAutomationQueue() {
  const redis = getRedis();
  if (!redis) return null;
  return new Queue(queueNames.automations, {
    connection: redis,
    defaultJobOptions,
  });
}

export function getDeadLetterQueue() {
  const redis = getRedis();
  if (!redis) return null;
  return new Queue(queueNames.deadLetter, { connection: redis });
}
