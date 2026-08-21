import Link from "next/link";
import {
  BarChart3,
  Inbox,
  KeyRound,
  MessageSquare,
  Sparkles,
  Workflow,
} from "lucide-react";
import { CampaignDifferentiator } from "@/components/marketing/campaign-differentiator";
import { DashboardPreview } from "@/components/marketing/dashboard-preview";
import { HeroDemo } from "@/components/marketing/hero-demo";
import { WorkflowPreview } from "@/components/marketing/workflow-preview";
import { Button } from "@/components/ui/button";
import { site } from "@/lib/site";

const trust = [
  "Simple setup",
  "Secure OAuth connection",
  "Official platform APIs",
  "Built for scale",
];

const steps = [
  {
    n: "01",
    title: "Connect",
    body: "Connect your Instagram or Facebook account with official Meta authentication.",
  },
  {
    n: "02",
    title: "Create",
    body: "Choose a post or reel and define what should happen when someone comments.",
  },
  {
    n: "03",
    title: "Automate",
    body: "VIDLIX sends the configured response automatically, within Meta’s rules.",
  },
];

const features = [
  {
    icon: MessageSquare,
    title: "Comment automation",
    body: "Monitor comments on posts and reels, then reply with the workflow you designed.",
  },
  {
    icon: KeyRound,
    title: "Keyword triggers",
    body: "Match exact words, aliases, phrases, and simple spelling variations — no AI required.",
  },
  {
    icon: Workflow,
    title: "Post & reel rules",
    body: "Attach different information to each campaign so the same keyword can return a different answer.",
  },
  {
    icon: Sparkles,
    title: "Smart response rules",
    body: "Combine price, location, and link into one private reply when a comment asks for more than one thing.",
  },
  {
    icon: Inbox,
    title: "Unified inbox",
    body: "See Instagram and Facebook conversations in one place, with campaign and automation context.",
  },
  {
    icon: BarChart3,
    title: "Campaign analytics",
    body: "Track comments, automated replies, failed sends, and the keywords that convert.",
  },
];

const faqs = [
  {
    q: "What is VIDLIX?",
    a: "VIDLIX is a professional SaaS platform for Instagram and Facebook automation. It turns comments into conversations using rule-based workflows.",
  },
  {
    q: "Which Instagram accounts are supported?",
    a: "Instagram professional accounts that Meta’s API supports. VIDLIX uses official OAuth and does not ask for Instagram passwords.",
  },
  {
    q: "Can I connect Facebook Pages?",
    a: "Yes. Connect a Facebook Page through official Meta authentication, then automate comments and Messenger where Meta allows it.",
  },
  {
    q: "Can I automate comments?",
    a: "Yes, using keyword, alias, fuzzy, any-comment, and post-specific rules. Actions stay within official Meta APIs and their limits.",
  },
  {
    q: "Can I create different rules for different Reels?",
    a: "Yes. Each campaign and post can carry its own price, location, links, and replies.",
  },
  {
    q: "Can one keyword have different replies for different campaigns?",
    a: "Yes. That is a core VIDLIX behaviour. “Price?” on Green Valley is not the same reply as “Price?” on Sky Heights.",
  },
  {
    q: "Do I need coding knowledge?",
    a: "No. The automation builder uses simple WHEN / WHERE / IF / THEN blocks.",
  },
  {
    q: "Can I disconnect my account?",
    a: "Yes. You can disconnect Instagram or Facebook from Channels at any time. Access tokens are never shown in the UI.",
  },
  {
    q: "What happens if Meta limits an action?",
    a: "VIDLIX shows a clear error, logs the event, and respects retries where safe. We do not bypass platform restrictions.",
  },
  {
    q: "Is my data secure?",
    a: "Accounts use encrypted sessions, environment-specific secrets, and webhook verification. See the Privacy Policy for processing details.",
  },
  {
    q: "Can I use VIDLIX on mobile?",
    a: "Yes. The marketing site and application are designed for mobile, tablet, and desktop.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:py-12">
        <div className="max-w-xl">
          <p className="text-sm font-medium text-accent">{site.tagline}</p>
          <h1 className="mt-3 text-[34px] font-semibold leading-[1.15] tracking-tight sm:text-[40px] lg:text-[52px]">
            Turn Every Comment Into a Conversation.
          </h1>
          <p className="mt-4 text-base leading-7 text-secondary sm:text-lg">
            Automate Instagram and Facebook conversations with simple, powerful
            workflows built for businesses and creators.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/signup">Start Free</Link>
            </Button>
            <Button asChild variant="secondary" size="lg" className="w-full sm:w-auto">
              <Link href="/how-it-works">See How It Works</Link>
            </Button>
          </div>
        </div>
        <HeroDemo />
      </section>

      <section className="border-y border-border bg-background-secondary py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-center text-sm font-medium text-secondary">
            Built for creators, businesses and teams
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {trust.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-border bg-card px-4 py-4 text-center text-sm font-medium"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="product" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <p className="text-sm font-medium text-accent">How it works</p>
        <h2 className="mt-3 max-w-2xl text-[28px] font-semibold tracking-tight sm:text-4xl">
          Connect, create, then let VIDLIX handle the conversation.
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <article
              key={step.n}
              className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow)]"
            >
              <p className="text-xs font-semibold tracking-[0.18em] text-accent">{step.n}</p>
              <h3 className="mt-3 text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-secondary">{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-background-secondary py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="max-w-2xl text-[28px] font-semibold tracking-tight sm:text-4xl">
            Everything you need for Phase 1 social automation.
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-3xl border border-border bg-card p-6 transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow)]"
              >
                <feature.icon className="h-5 w-5 text-accent" />
                <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-secondary">{feature.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="max-w-2xl text-[28px] font-semibold tracking-tight sm:text-4xl">
          The same keyword. A different answer for every campaign.
        </h2>
        <p className="mt-4 max-w-2xl text-secondary">
          Campaign A can sell Green Valley. Campaign B can sell Sky Heights. VIDLIX
          never mixes their prices, locations, or links.
        </p>
        <div className="mt-10">
          <CampaignDifferentiator />
        </div>
      </section>

      <section className="bg-background-secondary py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="max-w-2xl text-[28px] font-semibold tracking-tight sm:text-4xl">
            Global business facts, plus post-specific details.
          </h2>
          <p className="mt-4 max-w-2xl text-secondary">
            Priority is always post or reel information, then campaign information,
            then activated global business information. If someone asks for address
            and link, VIDLIX can combine both into one reply.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              ["1. Post / reel", "Product link, price, description, campaign location, brochure."],
              ["2. Campaign", "Structured campaign facts used by automations on that campaign."],
              ["3. Global business", "Address, phone, website, and general facts — only after you activate them."],
            ].map(([title, body]) => (
              <article key={title} className="rounded-3xl border border-border bg-card p-6">
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-secondary">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="text-[28px] font-semibold tracking-tight sm:text-4xl">
          A workflow anyone can understand.
        </h2>
        <div className="mt-10">
          <WorkflowPreview />
        </div>
      </section>

      <section className="bg-background-secondary py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-[28px] font-semibold tracking-tight sm:text-4xl">
            See the work as it happens.
          </h2>
          <div className="mt-10">
            <DashboardPreview />
          </div>
        </div>
      </section>

      <section id="resources" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-8 rounded-[32px] border border-border bg-card p-8 shadow-[var(--shadow)] lg:grid-cols-[1.2fr_0.8fr] lg:p-12">
          <div>
            <p className="text-sm font-medium text-accent">Starter</p>
            <h2 className="mt-3 text-4xl font-semibold">₹{site.pricing.starterMonthlyInr}/month</h2>
            <p className="mt-3 text-secondary">
              Instagram and Facebook automation, comment triggers, keyword rules,
              basic campaigns, inbox, and analytics. No AI or WhatsApp in Phase 1.
            </p>
            <Button asChild className="mt-6">
              <Link href="/pricing">View pricing</Link>
            </Button>
          </div>
          <ul className="space-y-2 text-sm text-secondary">
            {[
              "Instagram automation",
              "Facebook automation",
              "Comment triggers",
              "Keyword rules",
              "Basic campaigns",
              "Inbox",
              "Basic analytics",
            ].map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <h2 className="text-[28px] font-semibold tracking-tight sm:text-4xl">FAQ</h2>
        <div className="mt-8 space-y-4">
          {faqs.map((item) => (
            <details
              key={item.q}
              className="rounded-2xl border border-border bg-card px-5 py-4"
            >
              <summary className="cursor-pointer font-medium">{item.q}</summary>
              <p className="mt-3 text-sm leading-6 text-secondary">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
