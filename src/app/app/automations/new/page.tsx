import { AutomationForm } from "@/components/app/forms/automation-form";
import { ConfigNotice } from "@/components/app/config-notice";
import { tryWorkspace } from "@/lib/workspace-context";
import { saveAutomation } from "@/lib/actions/automations";

export default async function AutomationBuilderPage() {
  const context = await tryWorkspace("/app/automations/new");
  if (!context) return <ConfigNotice title="Automation builder" />;

  const campaigns = await context.prisma.campaign.findMany({
    where: { workspaceId: context.workspaceId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold">Automation builder</h1>
      <AutomationForm
        action={saveAutomation}
        campaigns={campaigns}
        submitLabel="Save draft"
      />
    </div>
  );
}
