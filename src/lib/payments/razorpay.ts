import { createHmac, timingSafeEqual } from "node:crypto";
import { assertServerSecret } from "@/lib/env";

export function verifyRazorpaySignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const secret = assertServerSecret(
    "RAZORPAY_KEY_SECRET",
    process.env.RAZORPAY_KEY_SECRET,
  );
  const body = `${params.orderId}|${params.paymentId}`;
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(params.signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function verifyRazorpayWebhook(rawBody: string, signature: string | null) {
  const secret = assertServerSecret(
    "RAZORPAY_WEBHOOK_SECRET",
    process.env.RAZORPAY_WEBHOOK_SECRET,
  );
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export const plans = {
  STARTER_MONTHLY: { amountPaise: 19900, period: "monthly", label: "Starter Monthly" },
  STARTER_YEARLY: { amountPaise: 199000, period: "yearly", label: "Starter Yearly" },
  PRO_MONTHLY: { amountPaise: 0, period: "monthly", label: "Pro Monthly", comingSoon: true },
  PRO_YEARLY: { amountPaise: 0, period: "yearly", label: "Pro Yearly", comingSoon: true },
} as const;
