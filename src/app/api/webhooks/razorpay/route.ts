import { NextResponse } from "next/server";
import { verifyRazorpayWebhook } from "@/lib/payments/razorpay";

export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature");
  if (!process.env.RAZORPAY_WEBHOOK_SECRET || !verifyRazorpayWebhook(raw, signature)) {
    return NextResponse.json(
      {
        title: "Payment webhook was rejected",
        reason: "The Razorpay signature could not be verified.",
        action: "Confirm RAZORPAY_WEBHOOK_SECRET for this environment.",
      },
      { status: 401 },
    );
  }
  return NextResponse.json({ ok: true, note: "Subscription state will update from verified events only." });
}
