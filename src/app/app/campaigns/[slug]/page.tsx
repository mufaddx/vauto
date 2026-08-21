import { demoCampaigns } from "@/lib/demo/data";
import { Card } from "@/components/ui/card";

export default function CampaignDetailsPage() {
  const campaign = demoCampaigns[0]!;
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold">{campaign.name}</h1>
      <p className="mt-1 text-sm text-secondary">Campaign facts used when comments mention price, location, or link.</p>
      <Card className="mt-6 space-y-2 p-6 text-sm">
        <p>Price: ₹45 Lakh</p>
        <p>Location: Delhi</p>
        <p>Link: example.com/green-valley</p>
      </Card>
    </div>
  );
}
