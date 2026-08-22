"use client";

import { useActionState, useMemo, useState } from "react";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { FieldError, FormMessage, SubmitButton } from "@/components/app/form-parts";
import { IDLE, type ActionState } from "@/lib/actions/shared";

export type AutomationValues = {
  id?: string;
  name?: string | null;
  platform?: string | null;
  triggerMode?: string | null;
  actionType?: string | null;
  campaignId?: string | null;
  postExternalId?: string | null;
  messageTemplate?: string | null;
  keywords?: string;
};

const selectClass =
  "h-11 w-full rounded-xl border border-border bg-card px-3 text-[15px] outline-none focus:border-accent";

export function AutomationForm({
  action,
  campaigns,
  values = {},
  submitLabel,
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  campaigns: Array<{ id: string; name: string }>;
  values?: AutomationValues;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, IDLE);
  const [triggerMode, setTriggerMode] = useState(values.triggerMode ?? "KEYWORD");
  const [keywords, setKeywords] = useState(values.keywords ?? "price\ncost\nkitne ka\nrate");

  const keywordCount = useMemo(
    () => keywords.split("\n").map((line) => line.trim()).filter(Boolean).length,
    [keywords],
  );

  return (
    <form action={formAction} className="space-y-4">
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}
      <FormMessage state={state} />

      <Card className="p-5">
        <p className="text-xs font-semibold tracking-[0.16em] text-accent">SETUP</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">Automation name</Label>
            <Input id="name" name="name" defaultValue={values.name ?? ""} required />
            <FieldError state={state} name="name" />
          </div>
          <div>
            <Label htmlFor="platform">Platform</Label>
            <select
              id="platform"
              name="platform"
              className={selectClass}
              defaultValue={values.platform ?? "INSTAGRAM"}
            >
              <option value="INSTAGRAM">Instagram</option>
              <option value="FACEBOOK">Facebook</option>
            </select>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <p className="text-xs font-semibold tracking-[0.16em] text-accent">WHEN</p>
        <p className="mt-1 font-medium">Comment received</p>
        <div className="mt-3">
          <Label htmlFor="triggerMode">Trigger</Label>
          <select
            id="triggerMode"
            name="triggerMode"
            className={selectClass}
            value={triggerMode}
            onChange={(event) => setTriggerMode(event.target.value)}
          >
            <option value="KEYWORD">Only when a keyword matches</option>
            <option value="ANY_COMMENT">Any comment</option>
          </select>
        </div>
      </Card>

      <Card className="p-5">
        <p className="text-xs font-semibold tracking-[0.16em] text-accent">WHERE</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="campaignId">Campaign</Label>
            <select
              id="campaignId"
              name="campaignId"
              className={selectClass}
              defaultValue={values.campaignId ?? ""}
            >
              <option value="">No campaign</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="postExternalId">Specific post id</Label>
            <Input
              id="postExternalId"
              name="postExternalId"
              placeholder="Leave empty for every post"
              defaultValue={values.postExternalId ?? ""}
            />
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <p className="text-xs font-semibold tracking-[0.16em] text-accent">IF</p>
        <Label htmlFor="keywords" className="mt-3">
          Comment contains
        </Label>
        <Textarea
          id="keywords"
          name="keywords"
          value={keywords}
          onChange={(event) => setKeywords(event.target.value)}
          disabled={triggerMode === "ANY_COMMENT"}
        />
        <FieldError state={state} name="keywords" />
        <p className="mt-2 text-xs text-muted">
          {triggerMode === "ANY_COMMENT"
            ? "Every comment on the selected posts will trigger this automation."
            : `${keywordCount} keywords. Known intents (price, location, link) automatically include Hinglish aliases and tolerate one typo.`}
        </p>
      </Card>

      <Card className="p-5">
        <p className="text-xs font-semibold tracking-[0.16em] text-accent">THEN</p>
        <div className="mt-3">
          <Label htmlFor="actionType">Action</Label>
          <select
            id="actionType"
            name="actionType"
            className={selectClass}
            defaultValue={values.actionType ?? "PRIVATE_REPLY"}
          >
            <option value="PRIVATE_REPLY">Send a private reply</option>
            <option value="COMMENT_REPLY">Reply on the comment thread</option>
            <option value="MESSENGER_REPLY">Send a Messenger message</option>
          </select>
        </div>
        <div className="mt-4">
          <Label htmlFor="messageTemplate">Message</Label>
          <Textarea
            id="messageTemplate"
            name="messageTemplate"
            defaultValue={
              values.messageTemplate ??
              "Hi {{username}} 👋 Thanks for your comment. Here are the details you asked for."
            }
            required
          />
          <FieldError state={state} name="messageTemplate" />
          <p className="mt-2 text-xs text-muted">
            Variables: {"{{username}}"} {"{{first_name}}"} {"{{campaign_name}}"} {"{{link}}"}
          </p>
        </div>
      </Card>

      <SubmitButton>{submitLabel}</SubmitButton>
      <p className="text-xs text-muted">
        Saving keeps the automation as a draft. It can only be activated after a
        successful test.
      </p>
    </form>
  );
}
