import { PageIntro } from "@/components/marketing/page-intro";

export default function Page() {
  return (
    <>
      <PageIntro eyebrow="Resources" title="Documentation" description="Architecture, Meta integration, payments, and environment rules live in the repository docs." />
      <p className="mx-auto max-w-3xl px-4 pb-20 text-sm text-secondary sm:px-6">A public API at api.vidlix.in is not available in Phase 1. Webhooks will use that host when the API surface is published.</p>
    </>
  );
}
