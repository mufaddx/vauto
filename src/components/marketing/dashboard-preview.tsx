import { Badge } from "@/components/ui/card";

const metrics = [
  { label: "Messages", value: "248" },
  { label: "Comments", value: "91" },
  { label: "Active automations", value: "12" },
  { label: "Leads", value: "37" },
];

export function DashboardPreview() {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow)] sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-secondary">Dashboard preview</p>
          <h3 className="text-lg font-semibold">Channels → Campaign → Result</h3>
        </div>
        <Badge tone="accent">Demo data</Badge>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-2xl bg-background-secondary p-4">
            <p className="text-xs text-muted">{metric.label}</p>
            <p className="mt-1 text-2xl font-semibold">{metric.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 space-y-3 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border px-4 py-3">
          <span>Instagram · “Price?”</span>
          <span className="text-success">DM sent</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border px-4 py-3">
          <span>Facebook · “Details?”</span>
          <span className="text-success">Messenger sent</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border px-4 py-3">
          <span>Campaign · Green Valley</span>
          <Badge tone="success">Active</Badge>
        </div>
      </div>
    </div>
  );
}
