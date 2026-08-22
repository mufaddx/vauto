import Link from "next/link";
import { oauthErrorMessage, SocialAuthButtons } from "@/components/auth/social-auth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { mailConfigured } from "@/lib/mail";
import { authFormMessage } from "@/lib/auth/form-errors";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; reset?: string }>;
}) {
  const { error, next, reset } = await searchParams;
  const nextPath = next && next.startsWith("/") && !next.startsWith("//") ? next : "";
  const message = authFormMessage(error) ?? oauthErrorMessage(error);
  const emailCodes = mailConfigured();

  return (
    <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow)]">
      <h1 className="text-2xl font-semibold">Login</h1>
      <p className="mt-2 text-sm text-secondary">
        {emailCodes
          ? "Continue with Google or Facebook, or get a code by email."
          : "Continue with Google or Facebook, or use your email."}
      </p>

      {reset ? (
        <p className="mt-4 rounded-xl bg-accent-soft px-3 py-2 text-sm text-accent">
          Your password has been updated. Log in with it below.
        </p>
      ) : null}
      {message ? (
        <p className="mt-4 rounded-xl bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] px-3 py-2 text-sm text-danger">
          {message}
        </p>
      ) : null}

      <div className="mt-6">
        <SocialAuthButtons intent="login" />
      </div>

      {emailCodes ? (
        <>
          {/* No password to remember: a code proves control of the inbox. */}
          <form action="/api/auth/otp/request" method="post" className="mt-4 space-y-4">
            {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
            <div>
              <Label htmlFor="otp-email">Email</Label>
              <Input
                id="otp-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
              />
            </div>
            <Button type="submit" className="w-full">Email me a code</Button>
          </form>

          <details className="mt-6">
            <summary className="cursor-pointer text-sm text-secondary">
              Use a password instead
            </summary>
            <PasswordForm nextPath={nextPath} />
          </details>
        </>
      ) : (
        <PasswordForm nextPath={nextPath} />
      )}

      <div className="mt-6 flex justify-between text-sm">
        <Link href="/forgot-password" className="text-accent">Forgot password</Link>
        <Link href="/signup" className="text-accent">Create account</Link>
      </div>
    </div>
  );
}

function PasswordForm({ nextPath }: { nextPath: string }) {
  return (
    <form action="/api/auth/login" method="post" className="mt-4 space-y-4">
      {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      <Button type="submit" className="w-full">Login</Button>
    </form>
  );
}
