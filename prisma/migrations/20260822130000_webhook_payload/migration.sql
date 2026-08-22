-- AlterTable
ALTER TABLE "WebhookEvent" ADD COLUMN "payload" JSONB,
ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0;
