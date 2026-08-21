import Link from "next/link";
import { demoCampaigns } from "@/lib/demo/data";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CampaignsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Campaigns</h1>
          <p className="text-sm text-secondary">Each campaign can answer the same keyword differently.</p>
        </div>
        <Button asChild>
          <Link href="/app/campaigns/new">Create Campaign</Link>
        </Button>
      </div>
      <div className="mt-6 grid gap-4">
        {demoCampaigns.map((campaign) => (
          <Card key={campaign.name} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{campaign.name}</h2>
                <p className="text-sm text-secondary">{campaign.channel} · {campaign.posts} posts · {campaign.automations} automations</p>
              </div>
              <Badge tone={campaign.status === "Active" ? "success" : "warning"}>{campaign.status}</Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <Link className="text-accent" href="/app/campaigns/green-valley">Open</Link>
              <span className="text-muted">Edit · Duplicate · Pause · Delete</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
