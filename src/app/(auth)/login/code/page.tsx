import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { OTP_LENGTH, OTP_TTL_MINUTES, isPlausibleEmail, normalizeEmail } from "@/lib/auth/otp";

const ERRORS: Record<string, string> = {
  code: "That code did not match. Check the latest email and try again.",
  expired: "That code has expired. Request a new one.",
  attempts: "Too many incorrect attempts. Request a new code.",
  throttled: "Too many attempts from this device. Wait a few minutes.",
  email: "That email address could not be read.",
  unavailable: "Email sign-in is unavailable on this deployment.",
};

function errorMessage(error: string | undefined) {
  if (!error) return null;
  if (ERRORS[error]) return ERRORS[error];
  if (error.startsWith("db_")) {
    return "The database could not be reached. Try again shortly.";
  }
  return "The code could not be verified.";
}

export default async function EnterCodePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const email = normalizeEmail(params.email ?? "");
  if (!isPlausibleEmail(email)) redirect("/login");

  const message = errorMessage(params.error);
  const nextPath =
    params.next && params.next.startsWith("/") && !params.next.startsWith("//")
      ? params.next
      : "";

  return (
    <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow)]">
      <h1 className="text-2xl font-semibold">Enter your code</h1>
      <p className="mt-2 text-sm text-secondary">
        We sent a {OTP_LENGTH}-digit code to <span className="font-medium">{email}</span>. It
        expires in {OTP_TTL_MINUTES} minutes.
      </p>

      {message ? (
        <p className="mt-4 rounded-xl bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] px-3 py-2 text-sm text-danger">
          {message}
        </p>
      ) : null}

      <form action="/api/auth/otp/verify" method="post" className="mt-6 space-y-4">
        <input type="hidden" name="email" value={email} />
        {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
        <div>
          <Label htmlFor="code">Sign-in code</Label>
          <Input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={OTP_LENGTH}
            placeholder="000000"
            className="text-center text-2xl tracking-[0.4em]"
            autoFocus
            required
          />
        </div>
        <Button type="submit" className="w-full">Continue</Button>
      </form>

      <form action="/api/auth/otp/request" method="post" className="mt-4">
        <input type="hidden" name="email" value={email} />
        {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
        <button type="submit" className="w-full text-center text-sm text-accent">
          Send a new code
        </button>
      </form>

      <p className="mt-4 text-center text-sm">
        <Link href="/login" className="text-accent">Use a different email</Link>
      </p>
    </div>
  );
}
