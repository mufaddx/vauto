import Link from "next/link";
import { greetingForHour } from "@/lib/utils";
import { Badge, Card, EmptyState } from "@/components/ui/card";
import { ConfigNotice } from "@/components/app/config-notice";
import { tryWorkspace } from "@/lib/workspace-context";
import { currentHour, daysAgo } from "@/lib/time";

export default async function AppHomePage() {
  const context = await tryWorkspace("/app");
  if (!context) return <ConfigNotice title="Overview" />;

  const { prisma, workspaceId, session } = context;
  const since = daysAgo(30);

  const [comments, replies, activeAutomations, contacts, activity] = await Promise.all([
    prisma.automationLog.count({ where: { workspaceId, createdAt: { gte: since } } }),
    prisma.message.count({
      where: {
        automated: true,
        conversation: { workspaceId },
        createdAt: { gte: since },
      },
    }),
    prisma.automation.count({ where: { workspaceId, status: "ACTIVE" } }),
    prisma.contact.count({ where: { workspaceId } }),
    prisma.automationLog.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const metrics = [
    { label: "Comments (30d)", value: comments },
    { label: "Messages sent (30d)", value: replies },
    { label: "Active automations", value: activeAutomations },
    { label: "Contacts", value: contacts },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold">
        {greetingForHour(currentHour(), session.firstName)}
      </h1>
      <p className="mt-1 text-sm text-secondary">
        Here&apos;s what&apos;s happening across your channels.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="p-5">
            <p className="text-sm text-secondary">{metric.label}</p>
            <p className="mt-2 text-3xl font-semibold">{metric.value}</p>
          </Card>
        ))}
      </div>

      <h2 className="mt-10 text-lg font-semibold">Recent automation activity</h2>
      {activity.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No activity yet"
            description="Once a channel is connected and an automation is active, every handled comment shows up here."
            action={
              <Link className="text-accent" href="/app/channels">
                Connect a channel
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {activity.map((item) => (
            <Card key={item.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{item.platform} · Comment detected</p>
                <Badge tone={item.status === "sent" ? "success" : "warning"}>
                  {item.status}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-secondary">
                &ldquo;{item.commentText ?? "(no text)"}&rdquo;
              </p>
              <p className="mt-1 text-sm text-secondary">
                {item.campaignName ? `Campaign: ${item.campaignName} · ` : ""}
                {item.action}
                {item.detectedIntents.length > 0
                  ? ` · ${item.detectedIntents.join(", ")}`
                  : ""}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
