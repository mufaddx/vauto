import Link from "next/link";
import { Card } from "@/components/ui/card";
import { RazorpayCheckout } from "@/components/billing/razorpay-checkout";
import { requireSession } from "@/lib/auth/session";
import { isPurchasablePlan, plans, razorpayConfigured } from "@/lib/payments/razorpay";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const session = await requireSession("/checkout");
  const { plan } = await searchParams;
  const planCode = plan && isPurchasablePlan(plan) ? plan : "STARTER_MONTHLY";
  const selected = plans[planCode];
  const rupees = (selected.amountPaise / 100).toLocaleString("en-IN");

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <h1 className="text-2xl font-semibold">Checkout</h1>
      <Card className="mt-6 p-6">
        <p className="font-medium">
          {selected.label} · ₹{rupees}
        </p>
        {razorpayConfigured() ? (
          <>
            <p className="mt-2 text-sm text-secondary">
              Razorpay Standard Checkout will open in a secure overlay. Your
              subscription activates once the payment signature and webhook are
              both verified.
            </p>
            <RazorpayCheckout
              planCode={planCode}
              planLabel={selected.label}
              email={session.email}
              name={session.firstName}
            />
          </>
        ) : (
          <p className="mt-2 text-sm text-secondary">
            Razorpay keys are not configured for this environment, so checkout is
            disabled. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to enable it.
          </p>
        )}
        <p className="mt-4 text-center text-sm">
          <Link href="/pricing" className="text-accent">Back to pricing</Link>
        </p>
      </Card>
    </div>
  );
}
