import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/app/form-parts";
import { BusinessForm } from "@/components/app/forms/business-form";
import { ConfigNotice } from "@/components/app/config-notice";
import { tryWorkspace } from "@/lib/workspace-context";
import {
  saveBusinessInformation,
  setBusinessInformationActive,
} from "@/lib/actions/library";

export default async function BusinessInformationPage() {
  const context = await tryWorkspace("/app/business-information");
  if (!context) return <ConfigNotice title="Business information" />;

  const business = await context.prisma.businessInformation.findUnique({
    where: { workspaceId: context.workspaceId },
  });
  const isActive = Boolean(business?.isActive);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold">Business information</h1>

      <Card
        className={
          isActive
            ? "mt-4 border-success/40 bg-[color-mix(in_srgb,var(--success)_10%,transparent)] p-4 text-sm"
            : "mt-4 border-warning/40 bg-[color-mix(in_srgb,var(--warning)_10%,transparent)] p-4 text-sm"
        }
      >
        {isActive
          ? `Business information is active and can be used as the fallback layer in automated responses${
              business?.activatedAt
                ? ` since ${business.activatedAt.toLocaleDateString("en-IN")}`
                : ""
            }.`
          : "Business information is not active. Activate it before using it in automated responses."}
      </Card>

      <BusinessForm action={saveBusinessInformation} values={business ?? {}} />

      <form action={setBusinessInformationActive} className="mt-4">
        <input type="hidden" name="active" value={isActive ? "false" : "true"} />
        <SubmitButton variant={isActive ? "secondary" : "primary"}>
          {isActive ? "Deactivate business information" : "Activate business information"}
        </SubmitButton>
      </form>

      <p className="mt-3 text-xs text-muted">
        Post-specific answers win over campaign answers, and campaign answers win
        over this global layer.
      </p>
    </div>
  );
}
