import { z } from "zod";

/** Result shape every server action returns, so forms can render errors. */
export type ActionState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export const OK: ActionState = { ok: true };

/** Starting state for useActionState: nothing submitted, nothing to report. */
export const IDLE: ActionState = { ok: false };

export function failure(error: string, fieldErrors?: Record<string, string>): ActionState {
  return { ok: false, error, fieldErrors };
}

/** Empty form inputs should become null, not empty strings, in the database. */
export const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? null : value))
  .nullable();

export const requiredText = (label: string, max = 200) =>
  z.string().trim().min(1, `${label} is required.`).max(max);

export function readForm(form: FormData) {
  const entries: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === "string") entries[key] = value;
  }
  return entries;
}

export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

/** Splits a textarea of one-per-line values into a clean list. */
export function lines(value: string | undefined | null) {
  return (value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
