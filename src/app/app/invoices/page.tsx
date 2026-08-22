import { Card, EmptyState } from "@/components/ui/card";
import { ConfigNotice } from "@/components/app/config-notice";
import { tryWorkspace } from "@/lib/workspace-context";

export default async function InvoicesPage() {
  const context = await tryWorkspace("/app/invoices");
  if (!context) return <ConfigNotice title="Invoices" />;

  const invoices = await context.prisma.invoice.findMany({
    where: { workspaceId: context.workspaceId },
    orderBy: { issuedAt: "desc" },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold">Invoices</h1>

      {invoices.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No invoices yet"
            description="Razorpay invoices appear here after a verified payment."
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-3">
          {invoices.map((invoice) => (
            <Card
              key={invoice.id}
              className="flex flex-wrap items-center justify-between gap-3 p-5"
            >
              <div>
                <p className="font-medium">
                  {invoice.currency} {(invoice.amountPaise / 100).toLocaleString("en-IN")}
                </p>
                <p className="text-sm text-secondary">
                  {invoice.issuedAt.toLocaleString("en-IN")}
                  {invoice.razorpayPaymentId ? ` · ${invoice.razorpayPaymentId}` : ""}
                </p>
              </div>
              <span className="text-sm text-secondary">{invoice.status}</span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
