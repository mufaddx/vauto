import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";

export default function BusinessInformationPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold">Business information</h1>
      <Card className="mt-4 border-warning/40 bg-[color-mix(in_srgb,var(--warning)_10%,transparent)] p-4 text-sm">
        Business information is not active. Activate it before using it in automated responses.
      </Card>
      <form className="mt-6 space-y-4">
        {[
          ["businessName", "Business name"],
          ["businessType", "Business type"],
          ["phone", "Phone"],
          ["email", "Email"],
          ["website", "Website"],
          ["defaultLocationLink", "Default location link"],
        ].map(([id, label]) => (
          <div key={id}>
            <Label htmlFor={id}>{label}</Label>
            <Input id={id} name={id} />
          </div>
        ))}
        <div>
          <Label htmlFor="address">Business address</Label>
          <Textarea id="address" name="address" />
        </div>
        <div>
          <Label htmlFor="general">General information</Label>
          <Textarea id="general" name="general" />
        </div>
        <div>
          <Label htmlFor="defaultMessage">Default response message</Label>
          <Textarea id="defaultMessage" name="defaultMessage" />
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="submit" variant="secondary">Save Changes</Button>
          <Button type="button">Activate Business Information</Button>
        </div>
      </form>
    </div>
  );
}
