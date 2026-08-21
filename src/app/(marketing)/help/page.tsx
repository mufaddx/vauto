import { PageIntro } from "@/components/marketing/page-intro";

export default function Page() {
  return (
    <>
      <PageIntro eyebrow="Resources" title="Help Center" description="Guides for connecting channels, testing automations, and billing." />
      <p className="mx-auto max-w-3xl px-4 pb-20 text-sm text-secondary sm:px-6">Help articles will expand as staging QA completes. Start with How It Works and Documentation.</p>
    </>
  );
}
