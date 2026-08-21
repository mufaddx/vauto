import { LegalNote, PageIntro } from "@/components/marketing/page-intro";
import { site } from "@/lib/site";

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
      <PageIntro
        eyebrow="Legal"
        title="Privacy Policy"
        description="How VIDLIX collects and uses account, comment, and message data. This is a structural draft for India’s evolving data-protection framework and must be reviewed before production."
      />
      <div className="space-y-6 text-sm leading-7 text-secondary">
        <p>Last updated: 22 August 2026. Operator: {site.legal.entity ?? "[Legal entity name to be inserted]"}.</p>
        <h2 className="text-lg font-semibold text-foreground">What we collect</h2>
        <p>Account details you provide (name, email, password hash), workspace settings, campaign and automation configuration, connected professional Instagram/Facebook identifiers, comments and messages required to run automations, billing metadata from Razorpay, and support tickets.</p>
        <h2 className="text-lg font-semibold text-foreground">Why we collect it</h2>
        <p>To authenticate you, connect official Meta channels, run keyword-based automations, operate inbox and contacts, process subscriptions, and provide support.</p>
        <h2 className="text-lg font-semibold text-foreground">Social account data</h2>
        <p>VIDLIX uses official OAuth. We do not collect Instagram or Facebook passwords. Access tokens are stored encrypted on the server and are never shown in the browser.</p>
        <h2 className="text-lg font-semibold text-foreground">Messages and comments</h2>
        <p>Comments and messages may be processed to detect configured keywords, compose rule-based replies, and display conversations in the inbox. Retention follows workspace settings and deletion requests.</p>
        <h2 className="text-lg font-semibold text-foreground">Retention and deletion</h2>
        <p>You may request deletion via the Data Deletion page. Tokens are removed on account deletion unless a legal obligation requires a limited record.</p>
        <h2 className="text-lg font-semibold text-foreground">Your rights</h2>
        <p>Subject to applicable law, you may request access, correction, or deletion of personal data we hold.</p>
        <h2 className="text-lg font-semibold text-foreground">Third parties</h2>
        <p>Meta (Instagram/Facebook APIs), Razorpay (payments), hosting/database/Redis/storage providers, and email delivery. A subprocessors list will be published when vendors are confirmed.</p>
        <h2 className="text-lg font-semibold text-foreground">Security</h2>
        <p>HTTPS, hashed passwords, signed sessions, webhook verification, environment-separated secrets, and role-based admin access.</p>
        <h2 className="text-lg font-semibold text-foreground">Contact</h2>
        <p>{site.emails.support}</p>
        <LegalNote />
      </div>
    </article>
  );
}
