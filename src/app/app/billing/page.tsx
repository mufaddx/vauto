import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { site } from "@/lib/site";

export default function BillingPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold">Billing</h1>
      <Card className="mt-6 space-y-2 p-6">
        <p>Current plan: Starter</p>
        <p>Monthly price: ₹{site.pricing.starterMonthlyInr}</p>
        <p>Usage: demo workspace</p>
        <p>Next billing date: —</p>
        <p>Payment status: not subscribed</p>
      </Card>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/checkout">Upgrade</Link>
        </Button>
        <Button variant="secondary">Downgrade</Button>
        <Button variant="danger">Cancel subscription</Button>
      </div>
      <p className="mt-6 text-sm">
        <Link href="/app/invoices" className="text-accent">Invoices and payment history</Link>
      </p>
    </div>
  );
}
