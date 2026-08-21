import { LegalNote, PageIntro } from "@/components/marketing/page-intro";

export default function Page() {
  return (
    <article className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
      <PageIntro
        eyebrow="Legal"
        title="Refund & Cancellation Policy"
        description="Subscription cancellation is available from Billing. Refund amounts and windows are placeholders until commercially confirmed."
      />
      <div className="space-y-4 text-sm leading-7 text-secondary">
        <p>You may cancel a subscription from the billing page. Access typically continues until the end of the paid period unless otherwise stated after legal review.</p>
        <p>Refund eligibility: [To be inserted after policy confirmation]. Chargebacks should be a last resort; contact support first.</p>
        <p>Failed payments may pause automations until the subscription is restored.</p>
        <LegalNote />
      </div>
    </article>
  );
}
