"use client";

import { useActionState } from "react";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { FieldError, FormMessage, SubmitButton } from "@/components/app/form-parts";
import { IDLE, type ActionState } from "@/lib/actions/shared";

const selectClass =
  "h-11 w-full rounded-xl border border-border bg-card px-3 text-[15px] outline-none focus:border-accent";

export function TemplateForm({
  action,
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
}) {
  const [state, formAction] = useActionState(action, IDLE);

  return (
    <Card className="p-5">
      <h2 className="font-semibold">New template</h2>
      <form action={formAction} className="mt-4 space-y-4">
        <FormMessage state={state} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="templateName">Name</Label>
            <Input id="templateName" name="name" required />
            <FieldError state={state} name="name" />
          </div>
          <div>
            <Label htmlFor="channel">Channel</Label>
            <select id="channel" name="channel" className={selectClass} defaultValue="">
              <option value="">Any channel</option>
              <option value="INSTAGRAM">Instagram</option>
              <option value="FACEBOOK">Facebook</option>
            </select>
          </div>
        </div>
        <div>
          <Label htmlFor="body">Message</Label>
          <Textarea id="body" name="body" required />
          <FieldError state={state} name="body" />
        </div>
        <SubmitButton>Create template</SubmitButton>
      </form>
    </Card>
  );
}
