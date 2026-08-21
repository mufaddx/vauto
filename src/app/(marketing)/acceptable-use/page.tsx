import { LegalNote, PageIntro } from "@/components/marketing/page-intro";

export default function Page() {
  return (
    <article className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
      <PageIntro
        eyebrow="Legal"
        title="Acceptable Use Policy"
        description="VIDLIX must never be used to bypass Instagram, Facebook, or Meta rules."
      />
      <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-secondary">
        <li>No spam, harassment, fraud, phishing, or credential theft.</li>
        <li>No unauthorized scraping, cookie automation, or unofficial APIs.</li>
        <li>No automated unsolicited messaging or fake engagement.</li>
        <li>No attempts to circumvent Meta restrictions or rate limits.</li>
        <li>Users must follow Instagram, Facebook, and Meta policies.</li>
      </ul>
      <LegalNote />
    </article>
  );
}
