import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export default function Page() {
  return (
    <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow)]">
      <h1 className="text-2xl font-semibold">Forgot password</h1>
      <p className="mt-2 text-sm text-secondary">We will email a reset link when mail is configured for this environment.</p>
      <form action="/api/auth/forgot-password" method="post" className="mt-6 space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <Button type="submit" className="w-full">Send reset link</Button>
      </form>
    </div>
  );
}
