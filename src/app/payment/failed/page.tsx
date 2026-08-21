import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">Payment could not be completed</h1>
      <p className="mt-3 text-sm text-secondary">The Razorpay charge did not succeed. You can retry checkout or contact support.</p>
      <Button asChild className="mt-6">
        <Link href="/checkout">Retry</Link>
      </Button>
    </div>
  );
}
