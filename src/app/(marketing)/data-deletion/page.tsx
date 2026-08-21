import { LegalNote, PageIntro } from "@/components/marketing/page-intro";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export default function Page() {
  return (
    <article className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
      <PageIntro
        eyebrow="Legal"
        title="Data deletion"
        description="Request deletion of VIDLIX account data. Disconnect Instagram and Facebook from Channels first if you also want those connections removed."
      />
      <form action="/api/data-deletion" method="post" className="space-y-4">
        <div>
          <Label htmlFor="email">Account email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <Button type="submit">Request deletion</Button>
      </form>
      <p className="mt-6 text-sm text-secondary">
        After deletion, access tokens are removed unless a disclosed legal or
        operational requirement says otherwise.
      </p>
      <LegalNote />
    </article>
  );
}
