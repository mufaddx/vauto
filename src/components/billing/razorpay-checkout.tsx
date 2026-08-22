"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { Button } from "@/components/ui/button";

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { email?: string; name?: string };
  theme: { color: string };
  handler: (response: RazorpayResponse) => void;
  modal: { ondismiss: () => void };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void };
  }
}

export function RazorpayCheckout({
  planCode,
  planLabel,
  email,
  name,
}: {
  planCode: string;
  planLabel: string;
  email?: string;
  name?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setError(null);
    if (!window.Razorpay) {
      setError("The Razorpay script has not loaded yet. Retry in a moment.");
      return;
    }
    setBusy(true);
    try {
      const orderRes = await fetch("/api/payments/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planCode }),
      });
      const order = await orderRes.json();
      if (!orderRes.ok) {
        setError(order.reason ?? "Checkout could not start.");
        setBusy(false);
        return;
      }

      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "VIDLIX",
        description: order.planLabel ?? planLabel,
        order_id: order.orderId,
        prefill: { email, name },
        theme: { color: "#6366f1" },
        modal: { ondismiss: () => setBusy(false) },
        handler: async (response) => {
          const verifyRes = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            }),
          });
          router.push(verifyRes.ok ? "/payment/success" : "/payment/failed");
        },
      });
      checkout.open();
    } catch {
      setError("Something went wrong while starting checkout.");
      setBusy(false);
    }
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onReady={() => setScriptReady(true)}
        onLoad={() => setScriptReady(true)}
      />
      <Button
        className="mt-6 w-full"
        onClick={startCheckout}
        disabled={busy || !scriptReady}
      >
        {busy ? "Opening Razorpay…" : `Pay with Razorpay`}
      </Button>
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
    </>
  );
}
