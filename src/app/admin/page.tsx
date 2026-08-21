import { Card } from "@/components/ui/card";
import { ThemeSwitcher } from "@/components/theme-switcher";

const metrics = [
  ["Total users", "0"],
  ["Active users", "0"],
  ["Paid users", "0"],
  ["MRR", "₹0"],
  ["Active automations", "0"],
  ["Messages processed", "0"],
  ["Webhook events", "0"],
  ["Failed events", "0"],
  ["API errors", "0"],
  ["System health", "Configure staging"],
];

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

export default function AdminHome() {
  return (
    <div className="min-h-full bg-background-secondary">
      <div className="grid lg:grid-cols-[240px_1fr]">
        <aside className="border-r border-border bg-card p-4">
          <p className="font-semibold">VIDLIX Admin</p>
          <nav className="mt-6 space-y-1 text-sm text-secondary">
            {nav.map((item) => (
              <p key={item} className="rounded-lg px-2 py-1.5">{item}</p>
            ))}
          </nav>
        </aside>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <ThemeSwitcher />
          </div>
          <p className="mt-1 text-sm text-secondary">Tokens and secrets are never shown here.</p>
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
