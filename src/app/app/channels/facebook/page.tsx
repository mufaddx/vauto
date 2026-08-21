import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function FacebookChannelPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold">Facebook Page</h1>
      <Card className="mt-6 space-y-2 p-6 text-sm">
        <p>Page: not connected</p>
        <p>Connection status: disconnected</p>
        <p>Permissions: pending OAuth</p>
        <p>Webhook status: not subscribed</p>
      </Card>
      <div className="mt-4 flex gap-3">
        <Button>Connect Facebook</Button>
        <Button variant="danger">Disconnect</Button>
      </div>
      <p className="mt-4 text-sm text-secondary">
        Messenger Send API requires Page permissions and respects messaging windows.
        Facebook passwords are never requested.
      </p>
    </div>
  );
}
