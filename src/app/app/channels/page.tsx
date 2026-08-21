import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ChannelsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h1 className="text-2xl font-semibold">Channels</h1>
      {[
        { name: "Instagram", href: "/app/channels/instagram", status: "Not connected" },
        { name: "Facebook", href: "/app/channels/facebook", status: "Not connected" },
      ].map((channel) => (
        <Card key={channel.name} className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="font-semibold">{channel.name}</p>
            <p className="text-sm text-secondary">{channel.status}</p>
          </div>
          <Button asChild>
            <Link href={channel.href}>Connect</Link>
          </Button>
        </Card>
      ))}
    </div>
  );
}
