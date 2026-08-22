import { ChannelDetail } from "@/components/app/channel-detail";
import { requireSession } from "@/lib/auth/session";
import { loadChannel } from "@/lib/channels";

export default async function InstagramChannelPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; connected?: string; disconnected?: string }>;
}) {
  const session = await requireSession("/app/channels/instagram");
  const [channel, params] = await Promise.all([
    loadChannel(session, "INSTAGRAM"),
    searchParams,
  ]);

  return (
    <ChannelDetail
      platform="instagram"
      title="Instagram"
      channel={channel}
      error={params.error}
      connected={params.connected}
      disconnected={params.disconnected}
      note="VIDLIX uses official Meta OAuth. Instagram passwords are never requested. Private replies follow Meta's documented limits."
    />
  );
}
