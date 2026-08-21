"use client";

import { useState } from "react";
import { demoConversations } from "@/lib/demo/data";
import { Badge, Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const tabs = ["All", "Unread", "Instagram", "Facebook", "Assigned", "Resolved"];

export default function InboxPage() {
  const [tab, setTab] = useState("All");
  const [active, setActive] = useState(0);
  const conversation = demoConversations[active]!;

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold">Inbox</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm",
              tab === item ? "bg-accent text-white" : "bg-card text-secondary",
            )}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="space-y-2">
          {demoConversations.map((item, index) => (
            <button
              key={item.username}
              type="button"
              onClick={() => setActive(index)}
              className={cn(
                "w-full rounded-2xl border px-4 py-3 text-left",
                active === index ? "border-accent bg-accent-soft" : "border-border bg-card",
              )}
            >
              <div className="flex justify-between gap-2">
                <p className="font-medium">{item.name}</p>
                <span className="text-xs text-muted">{item.time}</span>
              </div>
              <p className="text-sm text-secondary">{item.platform} · {item.last}</p>
            </button>
          ))}
        </div>
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold">{conversation.name}</p>
              <p className="text-sm text-secondary">@{conversation.username} · {conversation.campaign}</p>
            </div>
            <Badge tone="accent">{conversation.platform}</Badge>
          </div>
          <div className="mt-6 rounded-2xl bg-background-secondary p-4 text-sm">
            {conversation.last}
          </div>
          <p className="mt-4 text-xs text-muted">Automation status · tags · contact details appear here.</p>
        </Card>
      </div>
    </div>
  );
}
