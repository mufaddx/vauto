import { Card } from "@/components/ui/card";

const rows = [
  ["Total comments", "91"],
  ["Automated responses", "74"],
  ["Messages sent", "248"],
  ["Failed responses", "3"],
  ["Automation success rate", "96%"],
];

export default function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold">Analytics</h1>
      <p className="text-sm text-secondary">Demo figures until live events are processed.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(([label, value]) => (
          <Card key={label} className="p-5">
            <p className="text-sm text-secondary">{label}</p>
            <p className="mt-2 text-3xl font-semibold">{value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
