import { LegalNote, PageIntro } from "@/components/marketing/page-intro";

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
      <PageIntro
        eyebrow="Legal"
        title="Terms of Service"
        description="The agreement for using VIDLIX. This is a structural draft, not legal advice."
      />
      <div className="space-y-5 text-sm leading-7 text-secondary">
        {[
          ["Service description", "VIDLIX provides Instagram and Facebook automation using official platform APIs."],
          ["Eligibility", "You must be able to form a contract and have authority to connect the social accounts you add."],
          ["Account responsibilities", "Keep credentials secure. Do not share login details. You are responsible for activity in your workspace."],
          ["Third-party platforms", "Instagram, Facebook, and Meta may change APIs, permissions, or limits. VIDLIX cannot override those rules."],
          ["Acceptable use", "No spam, harassment, fraud, scraping, credential theft, fake engagement, or attempts to bypass Meta restrictions."],
          ["API limits", "When Meta or VIDLIX rate limits apply, some actions will be delayed or refused."],
          ["Availability", "We aim for reliable uptime but do not guarantee uninterrupted service."],
          ["Subscription and payment", "Phase 1 billing uses Razorpay. Subscription activation depends on server-side verification and webhooks, not only a browser redirect."],
          ["Cancellation and refund", "See the Refund & Cancellation Policy. Details remain placeholders until commercially confirmed."],
          ["Intellectual property", "VIDLIX branding, software, and documentation remain our property. Your content remains yours."],
          ["Termination", "We may suspend accounts that violate these terms or platform policies."],
          ["Limitation of liability", "To the extent permitted by law, VIDLIX is not liable for Meta outages, policy enforcement, or user-configured message content."],
          ["Disputes", "Dispute process and jurisdiction will be confirmed with the legal entity before launch."],
          ["Changes", "We may update the service and these terms. Material changes will be posted on this page."],
        ].map(([title, body]) => (
          <section key={title}>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <p className="mt-2">{body}</p>
          </section>
        ))}
        <LegalNote />
      </div>
    </article>
  );
}
