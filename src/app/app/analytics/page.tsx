import { Card } from "@/components/ui/card";
import { ConfigNotice } from "@/components/app/config-notice";
import { tryWorkspace } from "@/lib/workspace-context";
import { daysAgo } from "@/lib/time";

export default async function AnalyticsPage() {
  const context = await tryWorkspace("/app/analytics");
  if (!context) return <ConfigNotice title="Analytics" />;

  const { prisma, workspaceId } = context;
  const since = daysAgo(30);
  const window = { workspaceId, createdAt: { gte: since } };

  const [total, sent, failed, messages, byPlatform] = await Promise.all([
    prisma.automationLog.count({ where: window }),
    prisma.automationLog.count({ where: { ...window, status: "sent" } }),
    prisma.automationLog.count({ where: { ...window, status: "failed" } }),
    prisma.message.count({
      where: { automated: true, conversation: { workspaceId }, createdAt: { gte: since } },
    }),
    prisma.automationLog.groupBy({
      by: ["platform"],
      where: window,
      _count: { _all: true },
    }),
  ]);

  const successRate = total === 0 ? "—" : `${Math.round((sent / total) * 100)}%`;

  const rows: Array<[string, string | number]> = [
    ["Comments handled", total],
    ["Automated responses", sent],
    ["Messages sent", messages],
    ["Failed responses", failed],
    ["Automation success rate", successRate],
    ...byPlatform.map(
      (row) => [`${row.platform} comments`, row._count._all] as [string, number],
    ),
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold">Analytics</h1>
      <p className="text-sm text-secondary">Last 30 days for this workspace.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(([label, value]) => (
          <Card key={label} className="p-5">
            <p className="text-sm text-secondary">{label}</p>
            <p className="mt-2 text-3xl font-semibold">{value}</p>
          </Card>
        ))}
      </div>
      {total === 0 ? (
        <p className="mt-6 text-sm text-muted">
          Numbers stay at zero until a connected channel sends real comment
          webhooks and the worker processes them.
        </p>
      ) : null}
    </div>
  );
}
