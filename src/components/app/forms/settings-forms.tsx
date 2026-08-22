"use client";

import { useActionState } from "react";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { FieldError, FormMessage, SavedNotice, SubmitButton } from "@/components/app/form-parts";
import { IDLE, type ActionState } from "@/lib/actions/shared";

type Action = (prev: ActionState, form: FormData) => Promise<ActionState>;

export function ProfileForm({
  action,
  values,
}: {
  action: Action;
  values: {
    firstName: string;
    lastName: string | null;
    email: string;
    workspaceName: string;
  };
}) {
  const [state, formAction] = useActionState(action, IDLE);

  return (
    <Card className="p-6">
      <h2 className="font-semibold">Profile</h2>
      <form action={formAction} className="mt-4 space-y-4">
        <FormMessage state={state} />
        <SavedNotice state={state} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" name="firstName" defaultValue={values.firstName} required />
            <FieldError state={state} name="firstName" />
          </div>
          <div>
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" name="lastName" defaultValue={values.lastName ?? ""} />
          </div>
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" defaultValue={values.email} disabled />
          <p className="mt-1 text-xs text-muted">
            Email changes need verification and are not available yet.
          </p>
        </div>

        <div>
          <Label htmlFor="workspaceName">Workspace name</Label>
          <Input
            id="workspaceName"
            name="workspaceName"
            defaultValue={values.workspaceName}
            required
          />
          <FieldError state={state} name="workspaceName" />
        </div>

        <SubmitButton>Save changes</SubmitButton>
      </form>
    </Card>
  );
}

export function PasswordForm({ action }: { action: Action }) {
  const [state, formAction] = useActionState(action, IDLE);

  return (
    <Card className="p-6">
      <h2 className="font-semibold">Password</h2>
      <form action={formAction} className="mt-4 space-y-4">
        <FormMessage state={state} />
        <SavedNotice state={state} />

        <div>
          <Label htmlFor="currentPassword">Current password</Label>
          <Input
            id="currentPassword"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
          />
          <FieldError state={state} name="currentPassword" />
        </div>
        <div>
          <Label htmlFor="newPassword">New password</Label>
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            minLength={8}
            autoComplete="new-password"
            required
          />
          <FieldError state={state} name="newPassword" />
        </div>

        <SubmitButton variant="secondary">Update password</SubmitButton>
      </form>
    </Card>
  );
}
