import { Card, EmptyState } from "@/components/ui/card";
import { SubmitButton } from "@/components/app/form-parts";
import { TemplateForm } from "@/components/app/forms/template-form";
import { ConfigNotice } from "@/components/app/config-notice";
import { tryWorkspace } from "@/lib/workspace-context";
import { deleteTemplate, saveTemplate } from "@/lib/actions/library";

export default async function TemplatesPage() {
  const context = await tryWorkspace("/app/templates");
  if (!context) return <ConfigNotice title="Templates" />;

  const templates = await context.prisma.template.findMany({
    where: { workspaceId: context.workspaceId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Templates</h1>
        <p className="mt-2 text-sm text-secondary">
          Variables: {"{{first_name}}"} {"{{username}}"} {"{{campaign_name}}"} {"{{link}}"}
        </p>
      </div>

      <TemplateForm action={saveTemplate} />

      {templates.length === 0 ? (
        <EmptyState
          title="Create a reusable message"
          description="Templates stay within Meta-permitted messaging. Preview before you save."
        />
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{template.name}</h2>
                  <p className="text-sm text-secondary">{template.channel ?? "Any channel"}</p>
                </div>
                <form action={deleteTemplate}>
                  <input type="hidden" name="id" value={template.id} />
                  <SubmitButton variant="ghost" pendingLabel="…">
                    Delete
                  </SubmitButton>
                </form>
              </div>
              <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-background-secondary p-3 text-sm">
                {template.body}
              </pre>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
