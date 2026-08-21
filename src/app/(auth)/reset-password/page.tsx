import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export default function Page() {
  return (
    <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow)]">
      <h1 className="text-2xl font-semibold">Reset password</h1>
      <form action="/api/auth/reset-password" method="post" className="mt-6 space-y-4">
        <div>
          <Label htmlFor="password">New password</Label>
          <Input id="password" name="password" type="password" minLength={8} required />
        </div>
        <Button type="submit" className="w-full">Save password</Button>
      </form>
    </div>
  );
}
