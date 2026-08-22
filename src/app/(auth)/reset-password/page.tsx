import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow)]">
        <h1 className="text-2xl font-semibold">Reset password</h1>
        <p className="mt-2 text-sm text-secondary">
          This page needs a valid reset link. Request a new one to continue.
        </p>
        <p className="mt-6 text-sm">
          <Link href="/forgot-password" className="text-accent">Request a reset link</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow)]">
      <h1 className="text-2xl font-semibold">Reset password</h1>
      <p className="mt-2 text-sm text-secondary">
        Choose a new password of at least 8 characters.
      </p>
      <form action="/api/auth/reset-password" method="post" className="mt-6 space-y-4">
        <input type="hidden" name="token" value={token} />
        <div>
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            minLength={8}
            autoComplete="new-password"
            required
          />
        </div>
        <Button type="submit" className="w-full">Save password</Button>
      </form>
    </div>
  );
}
