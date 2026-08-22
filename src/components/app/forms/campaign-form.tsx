"use client";

import { useActionState } from "react";
import { Input, Label, Textarea } from "@/components/ui/input";
import { FieldError, FormMessage, SavedNotice, SubmitButton } from "@/components/app/form-parts";
import { IDLE, type ActionState } from "@/lib/actions/shared";

export type CampaignValues = {
  id?: string;
  name?: string | null;
  description?: string | null;
  category?: string | null;
  channel?: string | null;
  price?: string | null;
  location?: string | null;
  productLink?: string | null;
  details?: string | null;
  faq?: string | null;
  contactInfo?: string | null;
  cta?: string | null;
  brochureUrl?: string | null;
};

const selectClass =
  "h-11 w-full rounded-xl border border-border bg-card px-3 text-[15px] outline-none focus:border-accent";

export function CampaignForm({
  action,
  values = {},
  submitLabel,
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  values?: CampaignValues;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, IDLE);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}
      <FormMessage state={state} />
      <SavedNotice state={state} />

      <div>
        <Label htmlFor="name">Campaign name</Label>
        <Input id="name" name="name" defaultValue={values.name ?? ""} required />
        <FieldError state={state} name="name" />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" defaultValue={values.description ?? ""} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="category">Category</Label>
          <Input id="category" name="category" defaultValue={values.category ?? ""} />
        </div>
        <div>
          <Label htmlFor="channel">Channel</Label>
          <select
            id="channel"
            name="channel"
            className={selectClass}
            defaultValue={values.channel ?? "INSTAGRAM"}
          >
            <option value="INSTAGRAM">Instagram</option>
            <option value="FACEBOOK">Facebook</option>
            <option value="BOTH">Both</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="price">Price</Label>
          <Input id="price" name="price" placeholder="₹45 Lakh" defaultValue={values.price ?? ""} />
        </div>
        <div>
          <Label htmlFor="location">Location</Label>
          <Input id="location" name="location" defaultValue={values.location ?? ""} />
        </div>
      </div>

      <div>
        <Label htmlFor="productLink">Product / service link</Label>
        <Input id="productLink" name="productLink" defaultValue={values.productLink ?? ""} />
      </div>

      <div>
        <Label htmlFor="brochureUrl">Brochure link</Label>
        <Input id="brochureUrl" name="brochureUrl" defaultValue={values.brochureUrl ?? ""} />
      </div>

      <div>
        <Label htmlFor="details">Details</Label>
        <Textarea id="details" name="details" defaultValue={values.details ?? ""} />
      </div>

      <div>
        <Label htmlFor="faq">FAQ</Label>
        <Textarea id="faq" name="faq" defaultValue={values.faq ?? ""} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="contactInfo">Contact info</Label>
          <Input id="contactInfo" name="contactInfo" defaultValue={values.contactInfo ?? ""} />
        </div>
        <div>
          <Label htmlFor="cta">Call to action</Label>
          <Input id="cta" name="cta" defaultValue={values.cta ?? ""} />
        </div>
      </div>

      <p className="text-xs text-muted">
        This is structured rule-based information, not AI knowledge.
      </p>
      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
