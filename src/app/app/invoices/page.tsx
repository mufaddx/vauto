import { EmptyState } from "@/components/ui/card";

export default function InvoicesPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold">Invoices</h1>
      <div className="mt-6">
        <EmptyState
          title="No invoices yet"
          description="Razorpay invoices appear here after a verified payment."
        />
      </div>
    </div>
  );
}
