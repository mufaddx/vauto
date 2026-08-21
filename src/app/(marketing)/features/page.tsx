import { PageIntro } from "@/components/marketing/page-intro";
import Link from "next/link";

export default function FeaturesPage() {
  return (
    <>
      <PageIntro
        eyebrow="Features"
        title="Rule-based automation for Instagram and Facebook."
        description="Phase 1 is built around comments, keywords, campaigns, inbox, and analytics. AI, WhatsApp, and YouTube are reserved for later phases."
      />
      <div className="mx-auto max-w-3xl px-4 pb-20 text-secondary sm:px-6">
        <p>
          Explore the product from the <Link href="/" className="text-accent">home page</Link> or
          open the <Link href="/signup" className="text-accent">application</Link> after signup.
        </p>
      </div>
    </>
  );
}
