import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/card";

export default function TemplatesPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Templates</h1>
        <Button>Create Template</Button>
      </div>
      <p className="mt-2 text-sm text-secondary">Variables: {"{{first_name}}"} {"{{username}}"} {"{{campaign_name}}"} {"{{link}}"}</p>
      <div className="mt-6">
        <EmptyState
          title="Create a reusable message"
          description="Templates stay within Meta-permitted messaging. Preview before you save."
        />
      </div>
    </div>
  );
}
