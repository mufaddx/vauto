import { greetingForHour } from "@/lib/utils";
import { demoActivity, demoMetrics, demoUser } from "@/lib/demo/data";
import { Badge, Card } from "@/components/ui/card";

export default function AppHomePage() {
  const greeting = greetingForHour(9, demoUser.firstName);
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold">{greeting}</h1>
      <p className="mt-1 text-sm text-secondary">Here&apos;s what&apos;s happening across your channels.</p>
      <p className="mt-2 text-xs text-muted">Demo data until your workspace is connected.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {demoMetrics.map((metric) => (
          <Card key={metric.label} className="p-5">
            <p className="text-sm text-secondary">{metric.label}</p>
            <p className="mt-2 text-3xl font-semibold">{metric.value}</p>
          </Card>
        ))}
      </div>
      <h2 className="mt-10 text-lg font-semibold">Recent automation activity</h2>
      <div className="mt-4 space-y-3">
        {demoActivity.map((item) => (
          <Card key={item.comment + item.platform} className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">{item.platform} · {item.event}</p>
              <Badge tone="success">{item.status}</Badge>
            </div>
            <p className="mt-2 text-sm text-secondary">“{item.comment}”</p>
            <p className="mt-1 text-sm text-secondary">Campaign: {item.campaign} · {item.action}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
