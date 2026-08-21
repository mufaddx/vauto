import { LegalNote, PageIntro } from "@/components/marketing/page-intro";

export default function Page() {
  return (
    <article className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
      <PageIntro
        eyebrow="Legal"
        title="Cookie Policy"
        description="VIDLIX uses essential cookies for authentication and preferences. Non-essential cookies will only be used with a preference control."
      />
      <ul className="space-y-3 text-sm leading-7 text-secondary">
        <li>Essential: session, CSRF where applicable, load balancing.</li>
        <li>Authentication: signed session cookie.</li>
        <li>Preferences: theme (light / dark / system).</li>
        <li>Analytics: none until a provider is selected.</li>
        <li>Marketing: none in Phase 1.</li>
      </ul>
      <LegalNote />
    </article>
  );
}
