import { PageIntro } from "@/components/marketing/page-intro";

export default function FaqPage() {
  return (
    <>
      <PageIntro
        eyebrow="FAQ"
        title="Common questions."
        description="Answers stay within what Phase 1 actually supports."
      />
      <p className="mx-auto max-w-3xl px-4 pb-20 text-secondary sm:px-6">
        See the FAQ on the home page for the full list, including Instagram account
        types, campaign-specific replies, Meta limits, and mobile use.
      </p>
    </>
  );
}
