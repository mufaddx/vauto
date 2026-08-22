import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  isPurchasablePlan,
  periodEndFor,
  verifyRazorpaySignature,
  verifyRazorpayWebhook,
} from "@/lib/payments/razorpay";

const SECRET = "test_secret_key";

describe("razorpay signatures", () => {
  beforeEach(() => {
    process.env.RAZORPAY_KEY_SECRET = SECRET;
    process.env.RAZORPAY_WEBHOOK_SECRET = SECRET;
  });
  afterEach(() => {
    delete process.env.RAZORPAY_KEY_SECRET;
    delete process.env.RAZORPAY_WEBHOOK_SECRET;
  });

  it("accepts a correct checkout signature", () => {
    const orderId = "order_1";
    const paymentId = "pay_1";
    const signature = createHmac("sha256", SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");
    expect(verifyRazorpaySignature({ orderId, paymentId, signature })).toBe(true);
  });

  it("rejects a forged checkout signature", () => {
    expect(
      verifyRazorpaySignature({
        orderId: "order_1",
        paymentId: "pay_1",
        signature: "0".repeat(64),
      }),
    ).toBe(false);
  });

  it("rejects a signature of the wrong length without throwing", () => {
    expect(
      verifyRazorpaySignature({ orderId: "o", paymentId: "p", signature: "short" }),
    ).toBe(false);
  });

  it("verifies webhook bodies", () => {
    const body = JSON.stringify({ event: "payment.captured" });
    const signature = createHmac("sha256", SECRET).update(body).digest("hex");
    expect(verifyRazorpayWebhook(body, signature)).toBe(true);
    expect(verifyRazorpayWebhook(body, null)).toBe(false);
    expect(verifyRazorpayWebhook(`${body} `, signature)).toBe(false);
  });
});

describe("plans", () => {
  it("only allows plans with a real price", () => {
    expect(isPurchasablePlan("STARTER_MONTHLY")).toBe(true);
    expect(isPurchasablePlan("STARTER_YEARLY")).toBe(true);
    expect(isPurchasablePlan("PRO_MONTHLY")).toBe(false);
    expect(isPurchasablePlan("NOT_A_PLAN")).toBe(false);
  });

  it("adds one period to the start date", () => {
    const from = new Date("2026-01-15T00:00:00.000Z");
    expect(periodEndFor("STARTER_MONTHLY", from).toISOString()).toContain("2026-02-15");
    expect(periodEndFor("STARTER_YEARLY", from).toISOString()).toContain("2027-01-15");
  });
});
