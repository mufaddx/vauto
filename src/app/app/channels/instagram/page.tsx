import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function InstagramChannelPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold">Instagram</h1>
      <Card className="mt-6 space-y-2 p-6 text-sm">
        <p>Account: not connected</p>
        <p>Account type: professional accounts via Meta</p>
        <p>Permissions: pending OAuth</p>
        <p>Webhook status: not subscribed</p>
        <p>Last event received: —</p>
        <p className="text-muted">Access tokens are never displayed.</p>
      </Card>
      <div className="mt-4 flex gap-3">
        <Button>Connect Instagram</Button>
        <Button variant="danger">Disconnect</Button>
      </div>
      <p className="mt-4 text-sm text-secondary">
        VIDLIX uses official Meta OAuth. Instagram passwords are never requested.
        Private replies follow Meta’s documented limits.
      </p>
    </div>
  );
}
