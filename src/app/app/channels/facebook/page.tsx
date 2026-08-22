import { ChannelDetail } from "@/components/app/channel-detail";
import { requireSession } from "@/lib/auth/session";
import { loadChannel } from "@/lib/channels";

export default async function FacebookChannelPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; connected?: string; disconnected?: string }>;
}) {
  const session = await requireSession("/app/channels/facebook");
  const [channel, params] = await Promise.all([
    loadChannel(session, "FACEBOOK"),
    searchParams,
  ]);

  return (
    <ChannelDetail
      platform="facebook"
      title="Facebook"
      channel={channel}
      error={params.error}
      connected={params.connected}
      disconnected={params.disconnected}
      note="VIDLIX connects Facebook Pages through official Meta OAuth. Page access tokens are encrypted at rest and never displayed."
    />
  );
}
