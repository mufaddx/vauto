import Link from "next/link";
import { oauthErrorMessage, SocialAuthButtons } from "@/components/auth/social-auth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { mailConfigured } from "@/lib/mail";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message = oauthErrorMessage(error);
  const emailCodes = mailConfigured();

  return (
    <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow)]">
      <h1 className="text-2xl font-semibold">Create your VIDLIX account</h1>
      <p className="mt-2 text-sm text-secondary">
        {emailCodes
          ? "Sign up with Google or Facebook, or get a code by email."
          : "Sign up with Google or Facebook, or use email and password."}
      </p>

      {message ? (
        <p className="mt-4 rounded-xl bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] px-3 py-2 text-sm text-danger">
          {message}
        </p>
      ) : null}

      <div className="mt-6">
        <SocialAuthButtons intent="signup" />
      </div>

      {emailCodes ? (
        <>
          {/* The same code flow signs up and logs in — verifying the inbox is
              the account creation step, so there is no password to choose. */}
          <form action="/api/auth/otp/request" method="post" className="mt-4 space-y-4">
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
            <PasswordSignupForm />
          </details>
        </>
      ) : (
        <PasswordSignupForm />
      )}

      <p className="mt-6 text-sm text-secondary">
        Already have an account? <Link href="/login" className="text-accent">Login</Link>
      </p>
    </div>
  );
}

function PasswordSignupForm() {
  return (
    <form action="/api/auth/signup" method="post" className="mt-4 space-y-4">
      <div>
        <Label htmlFor="firstName">First name</Label>
        <Input id="firstName" name="firstName" required />
      </div>
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
          minLength={8}
          autoComplete="new-password"
          required
        />
      </div>
      <Button type="submit" className="w-full">Get Started</Button>
    </form>
  );
}
