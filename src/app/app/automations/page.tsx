import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge, Card, EmptyState } from "@/components/ui/card";
import { SubmitButton } from "@/components/app/form-parts";
import { ConfigNotice } from "@/components/app/config-notice";
import { tryWorkspace } from "@/lib/workspace-context";
import { activateAutomation, pauseAutomation } from "@/lib/actions/automations";

const TONES = {
  ACTIVE: "success",
  TESTING: "accent",
  DRAFT: "neutral",
  PAUSED: "warning",
} as const;

export default async function AutomationsPage() {
  const context = await tryWorkspace("/app/automations");
  if (!context) return <ConfigNotice title="Automations" />;

  const automations = await context.prisma.automation.findMany({
    where: { workspaceId: context.workspaceId },
    include: { campaign: { select: { name: true } }, _count: { select: { keywords: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Automations</h1>
        <Button asChild>
          <Link href="/app/automations/new">Create Automation</Link>
        </Button>
      </div>

      {automations.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="Automate your first conversation"
            description="Use WHEN / WHERE / IF / THEN blocks. Test with a sample comment before you activate."
            action={
              <Button asChild>
                <Link href="/app/automations/new">Create Automation</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {automations.map((automation) => (
            <Card key={automation.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{automation.name}</h2>
                  <p className="text-sm text-secondary">
                    {automation.platform} · {automation.triggerMode.replace("_", " ").toLowerCase()}{" "}
                    · {automation._count.keywords} keywords
                    {automation.campaign ? ` · ${automation.campaign.name}` : ""}
                  </p>
                </div>
                <Badge tone={TONES[automation.status]}>{automation.status}</Badge>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <Link className="text-accent" href={`/app/automations/${automation.id}`}>
                  Open
                </Link>
                {automation.status === "ACTIVE" ? (
                  <form action={pauseAutomation}>
                    <input type="hidden" name="id" value={automation.id} />
                    <SubmitButton variant="ghost" pendingLabel="…">
                      Pause
                    </SubmitButton>
                  </form>
                ) : (
                  <form action={activateAutomation}>
                    <input type="hidden" name="id" value={automation.id} />
                    <SubmitButton
                      variant="ghost"
                      pendingLabel="…"
                      disabled={!automation.lastTestedAt}
                    >
                      Activate
                    </SubmitButton>
                  </form>
                )}
                {!automation.lastTestedAt && automation.status !== "ACTIVE" ? (
                  <span className="text-xs text-muted">Needs a passing test</span>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
