"use client";

import { useActionState } from "react";
import { Input, Label } from "@/components/ui/input";
import { FieldError, FormMessage, SubmitButton } from "@/components/app/form-parts";
import { IDLE, type ActionState } from "@/lib/actions/shared";

const selectClass =
  "h-11 w-full rounded-xl border border-border bg-card px-3 text-[15px] outline-none focus:border-accent";

export function PostForm({
  action,
  campaignId,
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  campaignId: string;
}) {
  const [state, formAction] = useActionState(action, IDLE);

  return (
    <form action={formAction} className="mt-6 space-y-4 border-t border-border pt-6">
      <input type="hidden" name="campaignId" value={campaignId} />
      <FormMessage state={state} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="platform">Platform</Label>
          <select id="platform" name="platform" className={selectClass} defaultValue="INSTAGRAM">
            <option value="INSTAGRAM">Instagram</option>
            <option value="FACEBOOK">Facebook</option>
          </select>
        </div>
        <div>
          <Label htmlFor="externalId">Post / media id</Label>
          <Input id="externalId" name="externalId" placeholder="17912345678901234" required />
          <FieldError state={state} name="externalId" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="postTitle">Title</Label>
          <Input id="postTitle" name="title" />
        </div>
        <div>
          <Label htmlFor="permalink">Permalink</Label>
          <Input id="permalink" name="permalink" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="postPrice">Price for this post</Label>
          <Input id="postPrice" name="price" placeholder="Overrides the campaign price" />
        </div>
        <div>
          <Label htmlFor="postLocation">Location for this post</Label>
          <Input id="postLocation" name="location" />
        </div>
      </div>

      <div>
        <Label htmlFor="postLink">Link for this post</Label>
        <Input id="postLink" name="productLink" />
      </div>

      <SubmitButton variant="secondary">Link post</SubmitButton>
    </form>
  );
}
