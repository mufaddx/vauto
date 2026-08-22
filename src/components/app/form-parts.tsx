"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/lib/actions/shared";

/** Submit button that disables itself while its form is in flight. */
export function SubmitButton({
  children,
  variant = "primary",
  pendingLabel,
  ...props
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  pendingLabel?: string;
  disabled?: boolean;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} disabled={pending || props.disabled} {...props}>
      {pending ? (pendingLabel ?? "Saving…") : children}
    </Button>
  );
}

export function FormMessage({ state }: { state: ActionState }) {
  if (state.ok && !state.error) return null;
  if (!state.error) return null;
  return (
    <p className="rounded-xl bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] px-3 py-2 text-sm text-danger">
      {state.error}
    </p>
  );
}

export function FieldError({
  state,
  name,
}: {
  state: ActionState;
  name: string;
}) {
  const message = state.fieldErrors?.[name];
  if (!message) return null;
  return <p className="mt-1 text-sm text-danger">{message}</p>;
}

export function SavedNotice({ state }: { state: ActionState }) {
  if (!state.ok || state.error) return null;
  return (
    <p className="rounded-xl bg-accent-soft px-3 py-2 text-sm text-accent">Saved.</p>
  );
}
