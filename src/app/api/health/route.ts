import { NextResponse } from "next/server";
import { getRedis } from "@/lib/queues";
import { databaseTlsMode, databaseTlsVerified, pingDatabase } from "@/lib/db";
import { sessionSecretConfigured } from "@/lib/auth/session";
import { encryptionConfigured } from "@/lib/crypto";
import { metaConfigured } from "@/lib/meta/client";
import { razorpayConfigured } from "@/lib/payments/razorpay";
import { mailConfigured } from "@/lib/mail";
import { facebookLoginConfigured, googleConfigured } from "@/lib/auth/oauth";

/**
 * One place to see what this environment can actually do. Reports only
 * booleans and coarse hints — never secret values.
 */
export async function GET() {
  const database = await pingDatabase();
  const redis = getRedis();

  const integrations = {
    database: database.ok,
    redis: Boolean(redis),
    sessionSecret: sessionSecretConfigured(),
    encryptionKey: encryptionConfigured(),
    meta: metaConfigured(),
    metaWebhookToken: Boolean(process.env.META_WEBHOOK_VERIFY_TOKEN),
    razorpay: razorpayConfigured(),
    razorpayWebhook: Boolean(process.env.RAZORPAY_WEBHOOK_SECRET),
    googleLogin: googleConfigured(),
    facebookLogin: facebookLoginConfigured(),
    mail: mailConfigured(),
    databaseTlsVerified: databaseTlsVerified(),
  };

  // These must be present for the product to work at all.
  const required: Array<keyof typeof integrations> = [
    "database",
    "sessionSecret",
  ];
  const missing = Object.entries(integrations)
    .filter(([key, value]) => !value && required.includes(key as keyof typeof integrations))
    .map(([key]) => key);

  const pending = Object.entries(integrations)
    .filter(([key, value]) => !value && !required.includes(key as keyof typeof integrations))
    .map(([key]) => key);

  return NextResponse.json(
    {
      ok: missing.length === 0,
      env: process.env.APP_ENV ?? "development",
      database: database.ok,
      databaseHint: database.hint,
      databaseTls: databaseTlsMode(),
      redis: Boolean(redis),
      integrations,
      missingRequired: missing,
      pendingOptional: pending,
    },
    { status: missing.length === 0 ? 200 : 503 },
  );
}
