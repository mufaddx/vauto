export function PageIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-10 pt-16 sm:px-6">
      {eyebrow ? <p className="text-sm font-medium text-accent">{eyebrow}</p> : null}
      <h1 className="mt-2 text-[32px] font-semibold tracking-tight sm:text-5xl">{title}</h1>
      <p className="mt-4 text-base leading-7 text-secondary">{description}</p>
    </div>
  );
}

export function LegalNote() {
  return (
    <p className="mt-10 text-xs leading-5 text-muted">
      This page is a production-ready structure, not legal advice. Placeholders for
      legal entity, GSTIN, CIN, officer name, and contact details must be replaced
      with verified information and reviewed before launch.
    </p>
  );
}
