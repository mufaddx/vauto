import { CampaignForm } from "@/components/app/forms/campaign-form";
import { createCampaign } from "@/lib/actions/campaigns";
import { requireSession } from "@/lib/auth/session";

export default async function NewCampaignPage() {
  await requireSession("/app/campaigns/new");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold">Create campaign</h1>
      <CampaignForm action={createCampaign} submitLabel="Save draft" />
    </div>
  );
}
