import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { ConfigNotice } from "@/components/app/config-notice";
import { tryWorkspace } from "@/lib/workspace-context";
import { plans, razorpayConfigured } from "@/lib/payments/razorpay";

const TONES = {
  ACTIVE: "success",
  INCOMPLETE: "neutral",
  PAST_DUE: "warning",
  CANCELLED: "warning",
  EXPIRED: "neutral",
} as const;

export default async function BillingPage() {
  const context = await tryWorkspace("/app/billing");
  if (!context) return <ConfigNotice title="Billing" />;

  const subscription = await context.prisma.subscription.findFirst({
    where: { workspaceId: context.workspaceId },
    orderBy: { createdAt: "desc" },
  });

  const plan = subscription ? plans[subscription.planCode] : null;
  const isActive = subscription?.status === "ACTIVE";

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Billing</h1>
        {subscription ? (
          <Badge tone={TONES[subscription.status]}>{subscription.status}</Badge>
        ) : (
          <Badge>NOT SUBSCRIBED</Badge>
        )}
      </div>

      <Card className="mt-6 space-y-2 p-6">
        <p>Current plan: {plan?.label ?? "None"}</p>
        <p>
          Price:{" "}
          {plan ? `₹${(plan.amountPaise / 100).toLocaleString("en-IN")} / ${plan.period}` : "—"}
        </p>
        <p>
          Next billing date:{" "}
          {subscription?.currentPeriodEnd
            ? subscription.currentPeriodEnd.toLocaleDateString("en-IN")
            : "—"}
        </p>
        <p>
          Payment status:{" "}
          {isActive
            ? subscription.cancelAtPeriodEnd
              ? "active, cancels at period end"
              : "active"
            : "not subscribed"}
        </p>
      </Card>

      {!razorpayConfigured() ? (
        <Card className="mt-4 border-warning/40 bg-[color-mix(in_srgb,var(--warning)_10%,transparent)] p-4 text-sm">
          Razorpay is not configured for this environment, so checkout is
          unavailable. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.
        </Card>
      ) : (
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/checkout?plan=STARTER_MONTHLY">
              {isActive ? "Change to monthly" : "Subscribe monthly"}
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/checkout?plan=STARTER_YEARLY">Subscribe yearly</Link>
          </Button>
        </div>
      )}

      <p className="mt-6 text-sm">
        <Link href="/app/invoices" className="text-accent">
          Invoices and payment history
        </Link>
      </p>
      <p className="mt-3 text-xs text-muted">
        To cancel, email support — cancellation runs through Razorpay so the
        subscription state stays authoritative on their side.
      </p>
    </div>
  );
}
