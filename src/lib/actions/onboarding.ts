"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspace, WorkspaceUnavailableError } from "@/lib/workspace-context";

const TYPES = ["BUSINESS", "CREATOR", "AGENCY", "OTHER"] as const;

/** Persists the onboarding answers so the wizard is not throwaway UI. */
export async function saveOnboardingStep(form: FormData) {
  try {
    const { prisma, workspaceId } = await requireWorkspace("/onboarding");
    const accountType = String(form.get("accountType") ?? "");
    const step = Number(form.get("step") ?? 1);

    await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        ...(TYPES.includes(accountType as (typeof TYPES)[number])
          ? { accountType: accountType as (typeof TYPES)[number] }
          : {}),
        onboardingStep: Number.isFinite(step) ? Math.min(Math.max(step, 1), 4) : 1,
      },
    });
    revalidatePath("/onboarding");
  } catch (error) {
    if (error instanceof WorkspaceUnavailableError) return;
    throw error;
  }
}
