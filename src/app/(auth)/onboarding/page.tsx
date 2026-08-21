"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const types = ["Business", "Creator", "Agency", "Other"] as const;

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [accountType, setAccountType] = useState<(typeof types)[number]>("Business");

  return (
    <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow)]">
      <p className="text-sm text-accent">Step {step} of 4</p>
      {step === 1 ? (
        <>
          <h1 className="mt-2 text-2xl font-semibold">Tell us about yourself</h1>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {types.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setAccountType(type)}
                className={`rounded-2xl border px-4 py-4 text-sm font-medium ${accountType === type ? "border-accent bg-accent-soft" : "border-border"}`}
              >
                {type}
              </button>
            ))}
          </div>
          <Button className="mt-6 w-full" onClick={() => setStep(2)}>Continue</Button>
        </>
      ) : null}
      {step === 2 ? (
        <>
          <h1 className="mt-2 text-2xl font-semibold">Connect your channels</h1>
          <p className="mt-2 text-sm text-secondary">You can skip this and connect later from Channels. Creators are not required to enter business details.</p>
          <div className="mt-6 space-y-3">
            <div className="rounded-2xl border border-border px-4 py-4">Instagram</div>
            <div className="rounded-2xl border border-border px-4 py-4">Facebook</div>
          </div>
          <div className="mt-6 flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setStep(3)}>Skip for now</Button>
            <Button className="flex-1" asChild>
              <Link href="/app/channels">Connect</Link>
            </Button>
          </div>
        </>
      ) : null}
      {step === 3 ? (
        <>
          <h1 className="mt-2 text-2xl font-semibold">Create your first automation</h1>
          <p className="mt-2 text-sm text-secondary">Optional now. You can start from a campaign after you connect a channel.</p>
          <div className="mt-6 flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setStep(4)}>Skip</Button>
            <Button className="flex-1" asChild>
              <Link href="/app/automations/new">Create automation</Link>
            </Button>
          </div>
        </>
      ) : null}
      {step === 4 ? (
        <>
          <h1 className="mt-2 text-2xl font-semibold">You&apos;re ready</h1>
          <p className="mt-2 text-sm text-secondary">
            {accountType === "Business"
              ? "Activate Business Information in Settings before automations use global facts."
              : "Campaign information is optional for creator accounts."}
          </p>
          <Button className="mt-6 w-full" asChild>
            <Link href="/app">Go to dashboard</Link>
          </Button>
        </>
      ) : null}
    </div>
  );
}
