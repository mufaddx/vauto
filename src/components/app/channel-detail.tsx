import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export type ChannelView = {
  status: string;
  displayName: string | null;
  username: string | null;
  accountType: string | null;
  permissions: string[];
  webhookStatus: string | null;
  lastEventAt: Date | null;
  lastSyncedAt: Date | null;
};

const ERRORS: Record<string, string> = {
  meta_not_configured:
    "META_APP_ID and META_APP_SECRET are not set for this environment.",
  encryption_not_configured:
    "ENCRYPTION_KEY is not set, so access tokens cannot be stored safely.",
  state: "The connection request expired or could not be verified. Try again.",
  cancelled: "The Meta authorisation was cancelled.",
  code: "Meta did not return an authorisation code.",
  database: "This deployment has no database connection configured.",
  workspace: "This account has no workspace yet. Complete onboarding first.",
  no_pages: "No Facebook Pages were found on this Meta account.",
  no_instagram_business_account:
    "No Instagram professional account is linked to your Facebook Page.",
  exchange_failed: "Meta rejected the token exchange. Check the app credentials.",
};

function formatDate(value: Date | null) {
  return value ? new Date(value).toLocaleString("en-IN") : "—";
}

export function ChannelDetail({
  platform,
  title,
  channel,
  error,
  connected,
  disconnected,
  note,
}: {
  platform: "instagram" | "facebook";
  title: string;
  channel: ChannelView | null;
  error?: string;
  connected?: string;
  disconnected?: string;
  note: string;
}) {
  const isConnected = channel?.status === "CONNECTED";

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold">{title}</h1>

      {error ? (
        <p className="mt-4 rounded-xl bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] px-3 py-2 text-sm text-danger">
          {ERRORS[error] ?? "The connection could not be completed."}
        </p>
      ) : null}
      {connected ? (
        <p className="mt-4 rounded-xl bg-accent-soft px-3 py-2 text-sm text-accent">
          Connected {connected} account{connected === "1" ? "" : "s"}.
        </p>
      ) : null}
      {disconnected ? (
        <p className="mt-4 rounded-xl bg-accent-soft px-3 py-2 text-sm text-accent">
          Disconnected. The stored access token has been removed.
        </p>
      ) : null}

      <Card className="mt-6 space-y-2 p-6 text-sm">
        <p>Account: {channel?.username ?? channel?.displayName ?? "not connected"}</p>
        <p>Status: {channel?.status ?? "DISCONNECTED"}</p>
        <p>Account type: {channel?.accountType ?? "professional accounts via Meta"}</p>
        <p>
          Permissions:{" "}
          {channel?.permissions.length ? channel.permissions.join(", ") : "pending OAuth"}
        </p>
        <p>Webhook status: {channel?.webhookStatus ?? "not subscribed"}</p>
        <p>Last event received: {formatDate(channel?.lastEventAt ?? null)}</p>
        <p>Last synced: {formatDate(channel?.lastSyncedAt ?? null)}</p>
        <p className="text-muted">Access tokens are never displayed.</p>
      </Card>

      <div className="mt-4 flex flex-wrap gap-3">
        <Button asChild>
          <Link href={`/api/channels/${platform}/connect`}>
            {isConnected ? `Reconnect ${title}` : `Connect ${title}`}
          </Link>
        </Button>
        {isConnected ? (
          <form action={`/api/channels/${platform}/disconnect`} method="post">
            <Button variant="danger" type="submit">Disconnect</Button>
          </form>
        ) : null}
      </div>

      <p className="mt-4 text-sm text-secondary">{note}</p>
    </div>
  );
}
