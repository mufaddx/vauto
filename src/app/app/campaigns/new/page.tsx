import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

export default function NewCampaignPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold">Create campaign</h1>
      <form className="mt-6 space-y-4">
        <div>
          <Label htmlFor="name">Campaign name</Label>
          <Input id="name" name="name" required />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="category">Category</Label>
            <Input id="category" name="category" />
          </div>
          <div>
            <Label htmlFor="channel">Channel</Label>
            <select id="channel" name="channel" className="h-11 w-full rounded-xl border border-border bg-card px-3">
              <option>Instagram</option>
              <option>Facebook</option>
              <option>Both</option>
            </select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="price">Price</Label>
            <Input id="price" name="price" placeholder="₹45 Lakh" />
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" />
          </div>
        </div>
        <div>
          <Label htmlFor="link">Product / service link</Label>
          <Input id="link" name="link" />
        </div>
        <div>
          <Label htmlFor="faq">FAQ</Label>
          <Textarea id="faq" name="faq" />
        </div>
        <p className="text-xs text-muted">This is structured rule-based information, not AI knowledge.</p>
        <Button type="submit">Save draft</Button>
      </form>
    </div>
  );
}
