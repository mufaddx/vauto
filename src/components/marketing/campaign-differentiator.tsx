"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const campaigns = [
  {
    reel: "Reel A",
    name: "Green Valley",
    price: "₹45 Lakh",
    location: "Delhi",
    link: "example.com/green-valley",
  },
  {
    reel: "Reel B",
    name: "Sky Heights",
    price: "₹75 Lakh",
    location: "Noida",
    link: "example.com/sky-heights",
  },
];

export function CampaignDifferentiator() {
  const [active, setActive] = useState(0);
  const campaign = campaigns[active]!;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-3">
        {campaigns.map((item, index) => (
          <button
            key={item.name}
            type="button"
            onClick={() => setActive(index)}
            className={cn(
              "w-full rounded-2xl border px-4 py-4 text-left transition",
              active === index
                ? "border-accent bg-accent-soft"
                : "border-border bg-card hover:bg-background-secondary",
            )}
          >
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
              {item.reel}
            </p>
            <p className="mt-1 text-lg font-semibold">{item.name}</p>
            <p className="text-sm text-secondary">
              Price {item.price} · {item.location}
            </p>
          </button>
        ))}
      </div>
      <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow)]">
        <p className="text-sm text-secondary">Same keyword on both campaigns:</p>
        <p className="mt-2 rounded-xl bg-background-secondary px-3 py-2 text-sm font-medium">
          Price?
        </p>
        <div className="mt-6 space-y-2 text-sm">
          <p className="text-muted">{campaign.reel} → VIDLIX</p>
          <p className="text-lg font-semibold">{campaign.name} price: {campaign.price}</p>
          <p className="text-secondary">Location: {campaign.location}</p>
          <p className="text-secondary">Link: {campaign.link}</p>
        </div>
      </div>
    </div>
  );
}
