import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/card";

export default function AutomationsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Automations</h1>
        <Button asChild>
          <Link href="/app/automations/new">Create Automation</Link>
        </Button>
      </div>
      <div className="mt-6">
        <EmptyState
          title="Automate your first conversation"
          description="Use WHEN / WHERE / IF / THEN blocks. Test with a sample comment before you activate."
          action={
            <Button asChild>
              <Link href="/app/automations/new">Create Automation</Link>
            </Button>
          }
        />
      </div>
    </div>
  );
}
