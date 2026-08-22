import { createHmac, timingSafeEqual } from "node:crypto";
import { assertServerSecret } from "@/lib/env";

export type PlanCodeKey = "STARTER_MONTHLY" | "STARTER_YEARLY" | "PRO_MONTHLY" | "PRO_YEARLY";

export const plans = {
  STARTER_MONTHLY: { amountPaise: 19900, period: "monthly", label: "Starter Monthly" },
  STARTER_YEARLY: { amountPaise: 199000, period: "yearly", label: "Starter Yearly" },
  PRO_MONTHLY: { amountPaise: 0, period: "monthly", label: "Pro Monthly", comingSoon: true },
  PRO_YEARLY: { amountPaise: 0, period: "yearly", label: "Pro Yearly", comingSoon: true },
} as const;

export function isPurchasablePlan(code: string): code is PlanCodeKey {
  const plan = plans[code as PlanCodeKey];
  return Boolean(plan) && plan.amountPaise > 0;
}

export function razorpayConfigured() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

/** Public key id is safe to expose to the browser checkout widget. */
export function razorpayPublicKeyId() {
  return process.env.RAZORPAY_KEY_ID ?? "";
}

function safeEquals(expected: string, received: string) {
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function verifyRazorpaySignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const secret = assertServerSecret("RAZORPAY_KEY_SECRET", process.env.RAZORPAY_KEY_SECRET);
  const body = `${params.orderId}|${params.paymentId}`;
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  return safeEquals(expected, params.signature);
}

export function verifyRazorpayWebhook(rawBody: string, signature: string | null) {
  const secret = assertServerSecret("RAZORPAY_WEBHOOK_SECRET", process.env.RAZORPAY_WEBHOOK_SECRET);
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEquals(expected, signature);
}

export type RazorpayOrder = {
  id: string;
  amount: number;
  amount_paid?: number;
  currency: string;
  status: string;
  receipt?: string;
  notes?: Record<string, string>;
};

/**
 * Reads an order back from Razorpay. The notes we attached at creation time
 * are the only trustworthy source of workspace and plan for a payment — the
 * browser must never be believed about what was bought.
 */
export async function fetchRazorpayOrder(orderId: string): Promise<RazorpayOrder> {
  const keyId = assertServerSecret("RAZORPAY_KEY_ID", process.env.RAZORPAY_KEY_ID);
  const keySecret = assertServerSecret("RAZORPAY_KEY_SECRET", process.env.RAZORPAY_KEY_SECRET);
  const response = await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(orderId)}`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Razorpay order lookup failed (${response.status})`);
  }
  return (await response.json()) as RazorpayOrder;
}

/**
 * Server-side order creation against the Razorpay Orders API. Amounts are
 * always taken from the server-side plan table, never from the client.
 */
export async function createRazorpayOrder(params: {
  planCode: PlanCodeKey;
  workspaceId: string;
  receipt: string;
}): Promise<RazorpayOrder> {
  const keyId = assertServerSecret("RAZORPAY_KEY_ID", process.env.RAZORPAY_KEY_ID);
  const keySecret = assertServerSecret("RAZORPAY_KEY_SECRET", process.env.RAZORPAY_KEY_SECRET);
  const plan = plans[params.planCode];

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: plan.amountPaise,
      currency: "INR",
      receipt: params.receipt,
      notes: {
        workspaceId: params.workspaceId,
        planCode: params.planCode,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Razorpay order creation failed (${response.status}): ${body.slice(0, 200)}`);
  }

  return (await response.json()) as RazorpayOrder;
}

/** Adds one billing period to a start date. */
export function periodEndFor(planCode: PlanCodeKey, from = new Date()) {
  const end = new Date(from);
  if (plans[planCode].period === "yearly") {
    end.setFullYear(end.getFullYear() + 1);
  } else {
    end.setMonth(end.getMonth() + 1);
  }
  return end;
}
