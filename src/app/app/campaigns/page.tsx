import Link from "next/link";
import { Badge, Card, EmptyState } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/app/form-parts";
import { tryWorkspace } from "@/lib/workspace-context";
import { duplicateCampaign, setCampaignStatus } from "@/lib/actions/campaigns";
import { ConfigNotice } from "@/components/app/config-notice";

const TONES = {
  ACTIVE: "success",
  DRAFT: "neutral",
  PAUSED: "warning",
  COMPLETED: "neutral",
} as const;

export default async function CampaignsPage() {
  const context = await tryWorkspace("/app/campaigns");
  if (!context) return <ConfigNotice title="Campaigns" />;

  const campaigns = await context.prisma.campaign.findMany({
    where: { workspaceId: context.workspaceId },
    include: { _count: { select: { posts: true, automations: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Campaigns</h1>
          <p className="text-sm text-secondary">
            Each campaign can answer the same keyword differently.
          </p>
        </div>
        <Button asChild>
          <Link href="/app/campaigns/new">Create Campaign</Link>
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No campaigns yet"
            description="A campaign holds the price, location, and links that your automated replies draw from."
            action={
              <Button asChild>
                <Link href="/app/campaigns/new">Create Campaign</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{campaign.name}</h2>
                  <p className="text-sm text-secondary">
                    {campaign.channel} · {campaign._count.posts} posts ·{" "}
                    {campaign._count.automations} automations
                  </p>
                </div>
                <Badge tone={TONES[campaign.status]}>{campaign.status}</Badge>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <Link className="text-accent" href={`/app/campaigns/${campaign.id}`}>
                  Open
                </Link>

                <form action={setCampaignStatus}>
                  <input type="hidden" name="id" value={campaign.id} />
                  <input
                    type="hidden"
                    name="status"
                    value={campaign.status === "ACTIVE" ? "PAUSED" : "ACTIVE"}
                  />
                  <SubmitButton variant="ghost" pendingLabel="…">
                    {campaign.status === "ACTIVE" ? "Pause" : "Activate"}
                  </SubmitButton>
                </form>

                <form action={duplicateCampaign}>
                  <input type="hidden" name="id" value={campaign.id} />
                  <SubmitButton variant="ghost" pendingLabel="…">
                    Duplicate
                  </SubmitButton>
                </form>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
