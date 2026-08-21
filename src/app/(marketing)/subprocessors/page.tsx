import { LegalNote, PageIntro } from "@/components/marketing/page-intro";

export default function Page() {
  return (
    <article className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
      <PageIntro
        eyebrow="Legal"
        title="Subprocessors"
        description="Third-party processors will be listed here when vendors are confirmed. Do not treat this page as a complete live list yet."
      />
      <ul className="space-y-2 text-sm text-secondary">
        <li>Meta Platforms — Instagram and Facebook APIs</li>
        <li>Razorpay — payments (when enabled)</li>
        <li>Hosting, database, Redis, and object storage — [to be inserted]</li>
      </ul>
      <LegalNote />
    </article>
  );
}
