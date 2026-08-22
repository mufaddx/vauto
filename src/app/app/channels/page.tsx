import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireSession } from "@/lib/auth/session";
import { loadChannelSummary } from "@/lib/channels";

export default async function ChannelsPage() {
  const session = await requireSession("/app/channels");
  const summary = await loadChannelSummary(session);

  const channels = [
    {
      name: "Instagram",
      href: "/app/channels/instagram",
      channel: summary.instagram,
    },
    {
      name: "Facebook",
      href: "/app/channels/facebook",
      channel: summary.facebook,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h1 className="text-2xl font-semibold">Channels</h1>
      {channels.map(({ name, href, channel }) => {
        const connected = channel?.status === "CONNECTED";
        return (
          <Card key={name} className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <p className="font-semibold">{name}</p>
              <p className="text-sm text-secondary">
                {connected
                  ? `Connected${channel?.username ? ` · @${channel.username}` : ""}`
                  : "Not connected"}
              </p>
            </div>
            <Button asChild variant={connected ? "secondary" : "primary"}>
              <Link href={href}>{connected ? "Manage" : "Connect"}</Link>
            </Button>
          </Card>
        );
      })}
    </div>
  );
}
