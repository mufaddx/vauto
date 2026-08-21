import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">Payment cancelled</h1>
      <p className="mt-3 text-sm text-secondary">No charge was captured for this attempt.</p>
      <Button asChild className="mt-6">
        <Link href="/pricing">Return to pricing</Link>
      </Button>
    </div>
  );
}
