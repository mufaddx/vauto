import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { site } from "@/lib/site";

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <h1 className="text-2xl font-semibold">Checkout</h1>
      <Card className="mt-6 p-6">
        <p>Starter Monthly · ₹{site.pricing.starterMonthlyInr}</p>
        <p className="mt-2 text-sm text-secondary">
          Razorpay Standard Checkout will open after a server-created order exists
          for this environment. Subscription activation waits for signature
          verification and webhook confirmation.
        </p>
        <Button className="mt-6 w-full">Pay with Razorpay</Button>
        <p className="mt-4 text-center text-sm">
          <Link href="/pricing" className="text-accent">Back to pricing</Link>
        </p>
      </Card>
    </div>
  );
}
