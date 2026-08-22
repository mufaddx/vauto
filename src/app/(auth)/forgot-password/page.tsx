import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;

  return (
    <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow)]">
      <h1 className="text-2xl font-semibold">Forgot password</h1>
      {sent ? (
        <p className="mt-4 rounded-xl bg-accent-soft px-3 py-2 text-sm text-accent">
          If an account exists for that email, a reset link is on its way. The link
          expires in 60 minutes.
        </p>
      ) : (
        <p className="mt-2 text-sm text-secondary">
          Enter your email and we will send a link to set a new password.
        </p>
      )}
      <form action="/api/auth/forgot-password" method="post" className="mt-6 space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <Button type="submit" className="w-full">Send reset link</Button>
      </form>
      <p className="mt-4 text-center text-sm">
        <Link href="/login" className="text-accent">Back to login</Link>
      </p>
    </div>
  );
}
