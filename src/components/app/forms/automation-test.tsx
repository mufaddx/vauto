"use client";

import { useActionState } from "react";
import { Badge, Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { FormMessage, SubmitButton } from "@/components/app/form-parts";
import { IDLE } from "@/lib/actions/shared";
import type { TestResult } from "@/lib/actions/automations";

export function AutomationTest({
  action,
  automationId,
  alreadyTested,
}: {
  action: (prev: TestResult, form: FormData) => Promise<TestResult>;
  automationId: string;
  alreadyTested: boolean;
}) {
  const [state, formAction] = useActionState(action, IDLE as TestResult);

  return (
    <Card className="p-5">
      <h2 className="font-semibold">Test automation</h2>
      <p className="mt-1 text-sm text-secondary">
        The sample runs through the same engine that answers real comments.
      </p>

      <form action={formAction} className="mt-4 space-y-3">
        <input type="hidden" name="id" value={automationId} />
        <FormMessage state={state} />
        <div>
          <Label htmlFor="comment">Sample comment</Label>
          <Input id="comment" name="comment" defaultValue="price and location?" required />
        </div>
        <SubmitButton variant="secondary" pendingLabel="Testing…">
          Test automation
        </SubmitButton>
      </form>

      {state.intents?.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {state.intents.map((intent) => (
            <Badge key={intent} tone="accent">
              {intent}
            </Badge>
          ))}
        </div>
      ) : null}

      {state.ok && state.reason ? (
        <>
          <p className="mt-3 text-sm text-secondary">{state.reason}</p>
          {state.message ? (
            <pre className="mt-2 whitespace-pre-wrap rounded-xl bg-background-secondary p-3 text-sm">
              {state.message}
            </pre>
          ) : null}
        </>
      ) : null}

      <p className="mt-4 text-xs text-muted">
        {state.passed || alreadyTested
          ? "This automation has a passing test and can be activated."
          : "Activation stays locked until a test produces a reply."}
      </p>
    </Card>
  );
}
