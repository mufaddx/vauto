"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Badge, Card } from "@/components/ui/card";
import { RuleBasedResponseEngine } from "@/lib/engines/response-engine";
import { DEFAULT_ALIAS_SETS } from "@/lib/engines/keywords";

const engine = new RuleBasedResponseEngine();
const defs = Object.entries(DEFAULT_ALIAS_SETS).map(([intentKey, aliases]) => ({
  intentKey,
  keyword: aliases[0] ?? intentKey,
  aliases,
  fuzzy: true,
}));

export default function AutomationBuilderPage() {
  const [comment, setComment] = useState("price and location?");
  const [tested, setTested] = useState(false);
  const [preview, setPreview] = useState("");
  const [intents, setIntents] = useState<string[]>([]);
  const [keywords, setKeywords] = useState("price\ncost\nkitne ka\nrate");

  const keywordList = useMemo(
    () => keywords.split("\n").map((line) => line.trim()).filter(Boolean),
    [keywords],
  );

  async function runTest() {
    const result = await engine.compose({
      comment,
      username: "Rahul",
      campaignName: "Green Valley",
      triggerMode: "KEYWORD",
      keywordDefinitions: defs,
      campaign: { price: "₹45 Lakh", location: "Delhi", link: "example.com/green-valley" },
      businessInformationActive: true,
    });
    setPreview(result.message || result.reason);
    setIntents(result.intents.map((item) => item.intentKey));
    setTested(result.shouldReply);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold">Automation builder</h1>
      <Card className="p-5">
        <p className="text-xs font-semibold tracking-[0.16em] text-accent">WHEN</p>
        <p className="mt-1 font-medium">Comment received</p>
      </Card>
      <Card className="p-5">
        <p className="text-xs font-semibold tracking-[0.16em] text-accent">WHERE</p>
        <p className="mt-1 font-medium">Green Valley Reel</p>
      </Card>
      <Card className="p-5">
        <p className="text-xs font-semibold tracking-[0.16em] text-accent">IF</p>
        <Label htmlFor="keywords" className="mt-3">Comment contains</Label>
        <Textarea id="keywords" value={keywords} onChange={(e) => setKeywords(e.target.value)} />
        <p className="mt-2 text-xs text-muted">{keywordList.length} keywords including aliases.</p>
      </Card>
      <Card className="p-5">
        <p className="text-xs font-semibold tracking-[0.16em] text-accent">THEN</p>
        <p className="mt-1 font-medium">Send private reply</p>
      </Card>
      <Card className="p-5">
        <h2 className="font-semibold">Test automation</h2>
        <Label htmlFor="sample" className="mt-3">Sample comment</Label>
        <Input id="sample" value={comment} onChange={(e) => setComment(e.target.value)} />
        <div className="mt-3 flex flex-wrap gap-2">
          {intents.map((intent) => (
            <Badge key={intent} tone="accent">{intent}</Badge>
          ))}
        </div>
        {preview ? <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-background-secondary p-3 text-sm">{preview}</pre> : null}
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="secondary" type="button">Save Draft</Button>
          <Button type="button" onClick={runTest}>Test Automation</Button>
          <Button type="button" disabled={!tested}>Activate</Button>
        </div>
        <p className="mt-3 text-xs text-muted">Activate stays disabled until a successful test.</p>
      </Card>
    </div>
  );
}
