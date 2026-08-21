import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">Payment received</h1>
      <p className="mt-3 text-sm text-secondary">
        This page is a receipt view only. Your plan activates after server-side
        signature verification and the Razorpay webhook.
      </p>
      <Button asChild className="mt-6">
        <Link href="/app/billing">Go to billing</Link>
      </Button>
    </div>
  );
}
