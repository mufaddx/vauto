import { notFound } from "next/navigation";
import { Badge, Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/app/form-parts";
import { AutomationForm } from "@/components/app/forms/automation-form";
import { AutomationTest } from "@/components/app/forms/automation-test";
import { ConfigNotice } from "@/components/app/config-notice";
import { tryWorkspace } from "@/lib/workspace-context";
import {
  activateAutomation,
  deleteAutomation,
  pauseAutomation,
  saveAutomation,
  testAutomation,
} from "@/lib/actions/automations";

const TONES = {
  ACTIVE: "success",
  TESTING: "accent",
  DRAFT: "neutral",
  PAUSED: "warning",
} as const;

export default async function AutomationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await tryWorkspace(`/app/automations/${id}`);
  if (!context) return <ConfigNotice title="Automation" />;

  const [automation, campaigns] = await Promise.all([
    context.prisma.automation.findFirst({
      where: { id, workspaceId: context.workspaceId },
      include: { keywords: true },
    }),
    context.prisma.campaign.findMany({
      where: { workspaceId: context.workspaceId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  if (!automation) notFound();

  const recentLogs = await context.prisma.automationLog.findMany({
    where: { workspaceId: context.workspaceId, automationId: automation.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{automation.name}</h1>
          <p className="mt-1 text-sm text-secondary">
            {automation.lastTestedAt
              ? `Last passing test ${automation.lastTestedAt.toLocaleString("en-IN")}`
              : "Not tested yet"}
          </p>
        </div>
        <Badge tone={TONES[automation.status]}>{automation.status}</Badge>
      </div>

      <div className="flex flex-wrap gap-3">
        {automation.status === "ACTIVE" ? (
          <form action={pauseAutomation}>
            <input type="hidden" name="id" value={automation.id} />
            <SubmitButton variant="secondary">Pause</SubmitButton>
          </form>
        ) : (
          <form action={activateAutomation}>
            <input type="hidden" name="id" value={automation.id} />
            <SubmitButton disabled={!automation.lastTestedAt}>Activate</SubmitButton>
          </form>
        )}
        <form action={deleteAutomation}>
          <input type="hidden" name="id" value={automation.id} />
          <SubmitButton variant="danger" pendingLabel="Deleting…">
            Delete
          </SubmitButton>
        </form>
      </div>

      <AutomationTest
        action={testAutomation}
        automationId={automation.id}
        alreadyTested={Boolean(automation.lastTestedAt)}
      />

      <AutomationForm
        action={saveAutomation}
        campaigns={campaigns}
        submitLabel="Save changes"
        values={{
          ...automation,
          keywords: automation.keywords.map((rule) => rule.keyword).join("\n"),
        }}
      />

      <Card className="p-5">
        <h2 className="font-semibold">Recent activity</h2>
        {recentLogs.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            Nothing yet. Logs appear once real comments reach this automation.
          </p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {recentLogs.map((log) => (
              <li key={log.id} className="rounded-xl border border-border p-3">
                <p className="font-medium">{log.commentText ?? "(no text)"}</p>
                <p className="text-secondary">
                  {log.status} · {log.action} ·{" "}
                  {log.detectedIntents.length > 0 ? log.detectedIntents.join(", ") : "no intents"} ·{" "}
                  {log.createdAt.toLocaleString("en-IN")}
                </p>
                {log.error ? <p className="mt-1 text-danger">{log.error}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
