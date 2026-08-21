import { PageIntro } from "@/components/marketing/page-intro";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { site } from "@/lib/site";

export default function ContactPage() {
  return (
    <>
      <PageIntro
        eyebrow="Contact"
        title="Talk to the VIDLIX team."
        description="Use the form for product questions and support. Do not send passwords or access tokens."
      />
      <div className="mx-auto grid max-w-5xl gap-10 px-4 pb-20 sm:px-6 lg:grid-cols-2">
        <form action="/api/contact" method="post" className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" name="subject" required />
          </div>
          <div>
            <Label htmlFor="accountId">Account ID (optional)</Label>
            <Input id="accountId" name="accountId" />
          </div>
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" name="message" required />
          </div>
          <Button type="submit">Submit</Button>
        </form>
        <div className="rounded-3xl border border-border bg-card p-6 text-sm text-secondary">
          <p>Support email: {site.emails.support}</p>
          <p className="mt-3">Business contact details will appear here after the legal entity is confirmed.</p>
        </div>
      </div>
    </>
  );
}
