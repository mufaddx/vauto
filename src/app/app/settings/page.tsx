import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <form className="mt-6 space-y-4">
        <div>
          <Label htmlFor="firstName">First name</Label>
          <Input id="firstName" defaultValue="Mursalim" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" defaultValue="founder@vidlix.in" />
        </div>
        <Button type="submit">Save Changes</Button>
      </form>
    </div>
  );
}
