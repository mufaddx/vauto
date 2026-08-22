import { z } from "zod";

const optionalUrl = z.string().url().optional().or(z.literal(""));

const schema = z.object({
  APP_ENV: z.enum(["development", "staging", "production"]).default("development"),
  APP_URL: z.string().default("http://localhost:3000"),
  MARKETING_URL: z.string().default("http://localhost:3000"),
  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  SESSION_SECRET: z.string().min(16).optional(),
  ENCRYPTION_KEY: z.string().min(32).optional(),
  RESEND_API_KEY: z.string().optional(),
  MAIL_FROM: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  FACEBOOK_LOGIN_APP_ID: z.string().optional(),
  FACEBOOK_LOGIN_APP_SECRET: z.string().optional(),
  SESSION_COOKIE_NAME: z.string().default("vidlix_session"),
  META_APP_ID: z.string().optional(),
  META_APP_SECRET: z.string().optional(),
  META_WEBHOOK_VERIFY_TOKEN: z.string().optional(),
  META_GRAPH_VERSION: z.string().default("v21.0"),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
});

export type AppEnv = z.infer<typeof schema>;

let cached: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid environment: ${parsed.error.message}`);
  }
  cached = parsed.data;
  return cached;
}

export function isDatabaseConfigured() {
  // The runtime prefers DIRECT_URL (session pooler); either one is enough.
  return Boolean(process.env.DIRECT_URL || process.env.DATABASE_URL);
}

export function assertServerSecret(name: string, value: string | null | undefined) {
  if (!value) {
    throw new Error(`${name} is not configured for this environment.`);
  }
  return value;
}

/**
 * Reads an environment variable, treating an empty or whitespace-only value as
 * unset. Hosting dashboards happily store "", and `??` does not catch that —
 * which is how an empty APP_URL once produced a relative OAuth redirect_uri.
 */
export function envValue(name: string): string | null {
  const raw = process.env[name];
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export { optionalUrl };
