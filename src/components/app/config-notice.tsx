import Link from "next/link";
import { EmptyState } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Shown when the app is running without a database, so screens explain the
 * missing configuration instead of rendering an empty or fake state.
 */
export function ConfigNotice({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <div className="mt-6">
        <EmptyState
          title="This environment has no database connection"
          description="Set DATABASE_URL and DIRECT_URL for this deployment. Until then nothing can be stored or listed here."
          action={
            <Button asChild variant="secondary">
              <Link href="/api/health">Open /api/health</Link>
            </Button>
          }
        />
      </div>
    </div>
  );
}
