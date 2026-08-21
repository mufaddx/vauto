import { LegalNote, PageIntro } from "@/components/marketing/page-intro";
import { site } from "@/lib/site";

export default function Page() {
  return (
    <article className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
      <PageIntro
        eyebrow="Legal"
        title="Grievance redressal"
        description="Complaints can be sent by email or the contact form. A ticket ID is issued for support requests."
      />
      <div className="space-y-3 text-sm leading-7 text-secondary">
        <p>Grievance Officer: {site.legal.grievanceOfficer ?? "[Actual person/name to be inserted]"}</p>
        <p>Email: {site.emails.grievance ?? "[Official support email to be inserted]"}</p>
        <p>Response mechanism: email + website support form.</p>
      </div>
      <LegalNote />
    </article>
  );
}
