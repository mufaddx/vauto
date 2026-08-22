import { Card } from "@/components/ui/card";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { requireAdmin } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db";
import { daysAgo } from "@/lib/time";

const nav = [
  "Dashboard",
  "Users",
  "Workspaces",
  "Subscriptions",
  "Payments",
  "Channels",
  "Campaigns",
  "Automations",
  "Contacts",
  "Messages",
  "Webhooks",
  "API usage",
  "Errors",
  "Security",
  "Support",
  "Feature flags",
  "System health",
  "Audit logs",
];

/** Platform-wide counts. Never renders tokens, secrets, or message bodies. */
async function loadMetrics(): Promise<Array<[string, string]>> {
  const prisma = getPrisma();
  if (!prisma) {
    return [["System health", "No database configured"]];
  }

  const activeSince = daysAgo(30);

  const [
    users,
    activeUsers,
    paidWorkspaces,
    activeSubscriptions,
    activeAutomations,
    messages,
    webhookEvents,
    failedEvents,
    connectedChannels,
    openTickets,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { lastActiveAt: { gte: activeSince } } }),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.subscription.findMany({
      where: { status: "ACTIVE" },
      select: { planCode: true },
    }),
    prisma.automation.count({ where: { status: "ACTIVE" } }),
    prisma.message.count(),
    prisma.webhookEvent.count(),
    prisma.webhookEvent.count({ where: { status: { in: ["FAILED", "DEAD"] } } }),
    prisma.channel.count({ where: { status: "CONNECTED" } }),
    prisma.supportTicket.count({ where: { status: "open" } }),
  ]);

  // MRR is normalised to a monthly figure from the active plan mix.
  const monthlyPaise = activeSubscriptions.reduce((total, subscription) => {
    if (subscription.planCode === "STARTER_MONTHLY") return total + 19900;
    if (subscription.planCode === "STARTER_YEARLY") return total + Math.round(199000 / 12);
    return total;
  }, 0);

  return [
    ["Total users", String(users)],
    ["Active users (30d)", String(activeUsers)],
    ["Paid workspaces", String(paidWorkspaces)],
    ["MRR", `₹${Math.round(monthlyPaise / 100).toLocaleString("en-IN")}`],
    ["Active automations", String(activeAutomations)],
    ["Connected channels", String(connectedChannels)],
    ["Messages processed", String(messages)],
    ["Webhook events", String(webhookEvents)],
    ["Failed events", String(failedEvents)],
    ["Open support tickets", String(openTickets)],
  ];
}

export default async function AdminHome() {
  await requireAdmin();
  const metrics = await loadMetrics();

  return (
    <div className="min-h-full bg-background-secondary">
      <div className="grid lg:grid-cols-[240px_1fr]">
        <aside className="border-r border-border bg-card p-4">
          <p className="font-semibold">VIDLIX Admin</p>
          <nav className="mt-6 space-y-1 text-sm text-secondary">
            {nav.map((item) => (
              <p key={item} className="rounded-lg px-2 py-1.5">
                {item}
              </p>
            ))}
          </nav>
        </aside>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <ThemeSwitcher />
          </div>
          <p className="mt-1 text-sm text-secondary">
            Tokens and secrets are never shown here.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {metrics.map(([label, value]) => (
              <Card key={label} className="p-4">
                <p className="text-sm text-secondary">{label}</p>
                <p className="mt-2 text-2xl font-semibold">{value}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
