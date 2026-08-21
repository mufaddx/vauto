import { PageIntro } from "@/components/marketing/page-intro";
import { site } from "@/lib/site";

export default function AboutPage() {
  return (
    <>
      <PageIntro
        eyebrow="About"
        title="A focused social automation product."
        description={`${site.name} is founded by ${site.founder}. Phase 1 helps businesses and creators automate Instagram and Facebook conversations without unofficial workarounds.`}
      />
      <div className="mx-auto max-w-3xl px-4 pb-20 text-sm leading-7 text-secondary sm:px-6">
        <p>
          We do not invent customers, legal entities, or API capabilities. Official
          Meta APIs, staging-first deployment, and testable automations are part of
          the product contract.
        </p>
      </div>
    </>
  );
}
