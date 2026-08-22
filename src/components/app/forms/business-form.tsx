"use client";

import { useActionState } from "react";
import { Input, Label, Textarea } from "@/components/ui/input";
import { FieldError, FormMessage, SavedNotice, SubmitButton } from "@/components/app/form-parts";
import { IDLE, type ActionState } from "@/lib/actions/shared";

export type BusinessValues = {
  businessName?: string | null;
  businessType?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  defaultLocationLink?: string | null;
  address?: string | null;
  generalInformation?: string | null;
  defaultResponseMessage?: string | null;
};

const FIELDS: Array<[keyof BusinessValues, string]> = [
  ["businessName", "Business name"],
  ["businessType", "Business type"],
  ["phone", "Phone"],
  ["email", "Email"],
  ["website", "Website"],
  ["defaultLocationLink", "Default location link"],
];

export function BusinessForm({
  action,
  values = {},
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  values?: BusinessValues;
}) {
  const [state, formAction] = useActionState(action, IDLE);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <FormMessage state={state} />
      <SavedNotice state={state} />

      {FIELDS.map(([id, label]) => (
        <div key={id}>
          <Label htmlFor={id}>{label}</Label>
          <Input id={id} name={id} defaultValue={values[id] ?? ""} />
          <FieldError state={state} name={id} />
        </div>
      ))}

      <div>
        <Label htmlFor="address">Business address</Label>
        <Textarea id="address" name="address" defaultValue={values.address ?? ""} />
      </div>
      <div>
        <Label htmlFor="generalInformation">General information</Label>
        <Textarea
          id="generalInformation"
          name="generalInformation"
          defaultValue={values.generalInformation ?? ""}
        />
      </div>
      <div>
        <Label htmlFor="defaultResponseMessage">Default response message</Label>
        <Textarea
          id="defaultResponseMessage"
          name="defaultResponseMessage"
          defaultValue={values.defaultResponseMessage ?? ""}
        />
      </div>

      <SubmitButton variant="secondary">Save changes</SubmitButton>
    </form>
  );
}
