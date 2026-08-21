import Link from "next/link";
import { PageIntro } from "@/components/marketing/page-intro";
import { Button } from "@/components/ui/button";
import { site } from "@/lib/site";

export default function PricingPage() {
  return (
    <>
      <PageIntro
        eyebrow="Pricing"
        title="Simple Phase 1 pricing."
        description="Starter includes the Instagram and Facebook automation that is live today. Future Pro features are labelled Coming Soon."
      />
      <div className="mx-auto grid max-w-5xl gap-6 px-4 pb-20 sm:px-6 lg:grid-cols-2">
        <article className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow)]">
          <p className="text-sm font-medium text-accent">Starter</p>
          <p className="mt-3 text-4xl font-semibold">₹{site.pricing.starterMonthlyInr}<span className="text-lg text-secondary">/month</span></p>
          <p className="mt-2 text-sm text-secondary">or ₹{site.pricing.starterYearlyInr}/year</p>
          <ul className="mt-6 space-y-2 text-sm text-secondary">
            {[
              "Instagram automation",
              "Facebook automation",
              "Comment triggers",
              "Keyword rules",
              "Basic campaigns",
              "Inbox",
              "Basic analytics",
            ].map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
          <Button asChild className="mt-8 w-full">
            <Link href="/checkout">Continue to checkout</Link>
          </Button>
        </article>
        <article className="rounded-3xl border border-dashed border-border bg-background-secondary p-8">
          <p className="text-sm font-medium">Pro</p>
          <p className="mt-3 text-4xl font-semibold">Coming soon</p>
          <ul className="mt-6 space-y-2 text-sm text-secondary">
            <li>• AI replies — Coming soon</li>
            <li>• WhatsApp — Coming soon</li>
            <li>• Advanced CRM — Coming soon</li>
          </ul>
        </article>
      </div>
    </>
  );
}
