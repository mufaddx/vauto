import { PageIntro } from "@/components/marketing/page-intro";

export default function HowItWorksPage() {
  return (
    <>
      <PageIntro
        eyebrow="How it works"
        title="Three steps from a comment to a conversation."
        description="Connect a professional Instagram account or Facebook Page, create campaign rules, then activate automation after a successful test."
      />
      <ol className="mx-auto max-w-3xl space-y-6 px-4 pb-20 sm:px-6">
        {[
          ["Connect", "Official Meta OAuth. No passwords. Professional Instagram accounts and Facebook Pages only."],
          ["Create", "Pick a post or reel, set keywords or any-comment, and write the reply."],
          ["Automate", "VIDLIX validates the event, queues the work, and sends the configured response."],
        ].map(([title, body], index) => (
          <li key={title} className="rounded-3xl border border-border bg-card p-6">
            <p className="text-xs font-semibold tracking-[0.16em] text-accent">0{index + 1}</p>
            <h2 className="mt-2 text-xl font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-secondary">{body}</p>
          </li>
        ))}
      </ol>
    </>
  );
}
