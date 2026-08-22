import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/app/form-parts";
import { CampaignForm } from "@/components/app/forms/campaign-form";
import { ConfigNotice } from "@/components/app/config-notice";
import { tryWorkspace } from "@/lib/workspace-context";
import {
  addCampaignPost,
  deleteCampaign,
  deleteCampaignPost,
  setCampaignStatus,
  updateCampaign,
} from "@/lib/actions/campaigns";
import { PostForm } from "@/components/app/forms/post-form";

const TONES = {
  ACTIVE: "success",
  DRAFT: "neutral",
  PAUSED: "warning",
  COMPLETED: "neutral",
} as const;

export default async function CampaignDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const context = await tryWorkspace(`/app/campaigns/${slug}`);
  if (!context) return <ConfigNotice title="Campaign" />;

  const campaign = await context.prisma.campaign.findFirst({
    where: { id: slug, workspaceId: context.workspaceId },
    include: {
      posts: true,
      automations: { select: { id: true, name: true, status: true } },
    },
  });
  if (!campaign) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{campaign.name}</h1>
          <p className="mt-1 text-sm text-secondary">
            Campaign facts used when comments mention price, location, or link.
          </p>
        </div>
        <Badge tone={TONES[campaign.status]}>{campaign.status}</Badge>
      </div>

      <div className="flex flex-wrap gap-3">
        <form action={setCampaignStatus}>
          <input type="hidden" name="id" value={campaign.id} />
          <input
            type="hidden"
            name="status"
            value={campaign.status === "ACTIVE" ? "PAUSED" : "ACTIVE"}
          />
          <SubmitButton variant="secondary">
            {campaign.status === "ACTIVE" ? "Pause campaign" : "Activate campaign"}
          </SubmitButton>
        </form>
        <form action={deleteCampaign}>
          <input type="hidden" name="id" value={campaign.id} />
          <SubmitButton variant="danger" pendingLabel="Deleting…">
            Delete
          </SubmitButton>
        </form>
      </div>

      <Card className="p-6">
        <h2 className="font-semibold">Linked posts</h2>
        <p className="mt-1 text-sm text-secondary">
          A post-specific answer always wins over the campaign-wide one.
        </p>

        {campaign.posts.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No posts linked yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {campaign.posts.map((post) => (
              <li
                key={post.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{post.title ?? post.externalId}</p>
                  <p className="text-secondary">
                    {post.platform} · {post.externalId}
                    {post.price ? ` · ${post.price}` : ""}
                  </p>
                </div>
                <form action={deleteCampaignPost}>
                  <input type="hidden" name="postId" value={post.id} />
                  <input type="hidden" name="campaignId" value={campaign.id} />
                  <SubmitButton variant="ghost" pendingLabel="…">
                    Remove
                  </SubmitButton>
                </form>
              </li>
            ))}
          </ul>
        )}

        <PostForm action={addCampaignPost} campaignId={campaign.id} />
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold">Automations</h2>
        {campaign.automations.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            No automations use this campaign yet.{" "}
            <Link className="text-accent" href="/app/automations/new">
              Create one
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {campaign.automations.map((automation) => (
              <li key={automation.id}>
                <Link className="text-accent" href={`/app/automations/${automation.id}`}>
                  {automation.name}
                </Link>{" "}
                <span className="text-secondary">· {automation.status}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold">Campaign details</h2>
        <CampaignForm action={updateCampaign} values={campaign} submitLabel="Save changes" />
      </Card>
    </div>
  );
}
