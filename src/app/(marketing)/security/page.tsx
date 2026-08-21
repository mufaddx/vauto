import { LegalNote, PageIntro } from "@/components/marketing/page-intro";

export default function Page() {
  return (
    <article className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
      <PageIntro
        eyebrow="Security"
        title="Security practices"
        description="VIDLIX is designed with HTTPS, secure cookies, webhook verification, encrypted secrets, password hashing, RBAC, audit logs, and environment isolation."
      />
      <p className="text-sm leading-7 text-secondary">
        Staging and production never share databases, Redis, storage, or secrets.
        Report suspected issues to the support email once it is confirmed.
      </p>
      <LegalNote />
    </article>
  );
}
