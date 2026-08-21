import Link from "next/link";
import { oauthErrorMessage, SocialAuthButtons } from "@/components/auth/social-auth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message = oauthErrorMessage(error);

  return (
    <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow)]">
      <h1 className="text-2xl font-semibold">Login</h1>
      <p className="mt-2 text-sm text-secondary">
        Continue with Google or Facebook, or use your email.
      </p>
      {message ? (
        <p className="mt-4 rounded-xl bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] px-3 py-2 text-sm text-danger">
          {message}
        </p>
      ) : null}
      <div className="mt-6">
        <SocialAuthButtons intent="login" />
      </div>
      <form action="/api/auth/login" method="post" className="mt-4 space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
        </div>
        <Button type="submit" className="w-full">Login</Button>
      </form>
      <div className="mt-4 flex justify-between text-sm">
        <Link href="/forgot-password" className="text-accent">Forgot password</Link>
        <Link href="/signup" className="text-accent">Create account</Link>
      </div>
    </div>
  );
}
