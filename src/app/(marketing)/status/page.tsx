import { PageIntro } from "@/components/marketing/page-intro";
import { Badge } from "@/components/ui/card";

export default function Page() {
  return (
    <>
      <PageIntro eyebrow="Status" title="System status" description="Operational status for marketing, app, and webhook processing." />
      <div className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
        <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-4">
          <span>All monitored surfaces</span>
          <Badge tone="success">Placeholder · configure monitoring</Badge>
        </div>
      </div>
    </>
  );
}
