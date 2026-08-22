"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireWorkspace, WorkspaceUnavailableError } from "@/lib/workspace-context";
import {
  failure,
  lines,
  optionalText,
  readForm,
  requiredText,
  zodFieldErrors,
  type ActionState,
} from "@/lib/actions/shared";
import { createResponseEngine } from "@/lib/engines";
import { DEFAULT_ALIAS_SETS, type KeywordDefinition } from "@/lib/engines/keywords";

const automationSchema = z.object({
  id: optionalText,
  name: requiredText("Automation name"),
  platform: z.enum(["INSTAGRAM", "FACEBOOK"]),
  triggerMode: z.enum(["KEYWORD", "ANY_COMMENT"]).default("KEYWORD"),
  actionType: z
    .enum(["PRIVATE_REPLY", "MESSENGER_REPLY", "COMMENT_REPLY"])
    .default("PRIVATE_REPLY"),
  campaignId: optionalText,
  postExternalId: optionalText,
  messageTemplate: requiredText("Message", 2000),
  keywords: z.string().optional(),
  intentKey: z.string().optional(),
});

/**
 * Turns the keyword textarea into rules. Each line is one keyword; when the
 * line matches a known intent the default alias set is attached so Hinglish
 * and misspellings are covered without the user typing them out.
 */
function rulesFrom(keywordText: string | undefined, intentKey: string | undefined) {
  const entries = lines(keywordText);
  if (entries.length === 0) return [];

  return entries.map((keyword) => {
    const key = intentKey?.trim() || guessIntent(keyword) || keyword.toLowerCase();
    return {
      intentKey: key,
      keyword,
      aliases: DEFAULT_ALIAS_SETS[key] ?? [],
      fuzzy: true,
      responseText: "",
    };
  });
}

function guessIntent(keyword: string) {
  const normalized = keyword.toLowerCase();
  for (const [intent, aliases] of Object.entries(DEFAULT_ALIAS_SETS)) {
    if (aliases.includes(normalized)) return intent;
  }
  return null;
}

async function assertCampaign(
  prisma: Awaited<ReturnType<typeof requireWorkspace>>["prisma"],
  workspaceId: string,
  campaignId: string | null,
) {
  if (!campaignId) return true;
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, workspaceId },
    select: { id: true },
  });
  return Boolean(campaign);
}

export async function saveAutomation(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  let target: string;
  try {
    const { prisma, workspaceId } = await requireWorkspace("/app/automations/new");
    const parsed = automationSchema.safeParse(readForm(form));
    if (!parsed.success) {
      return failure("Check the highlighted fields.", zodFieldErrors(parsed.error));
    }
    const data = parsed.data;

    if (data.triggerMode === "KEYWORD" && lines(data.keywords).length === 0) {
      return failure("Add at least one keyword, or switch the trigger to any comment.", {
        keywords: "At least one keyword is required.",
      });
    }
    if (!(await assertCampaign(prisma, workspaceId, data.campaignId))) {
      return failure("That campaign no longer exists.");
    }

    const rules = rulesFrom(data.keywords, data.intentKey);
    const base = {
      name: data.name,
      platform: data.platform,
      triggerMode: data.triggerMode,
      actionType: data.actionType,
      campaignId: data.campaignId,
      postExternalId: data.postExternalId,
      messageTemplate: data.messageTemplate,
    };

    if (data.id) {
      const existing = await prisma.automation.findFirst({
        where: { id: data.id, workspaceId },
        select: { id: true },
      });
      if (!existing) return failure("That automation no longer exists.");

      // Editing invalidates the previous successful test.
      await prisma.$transaction([
        prisma.automation.update({
          where: { id: data.id },
          data: { ...base, status: "DRAFT", lastTestedAt: null },
        }),
        prisma.keywordRule.deleteMany({ where: { automationId: data.id } }),
        prisma.keywordRule.createMany({
          data: rules.map((rule) => ({ ...rule, automationId: data.id! })),
        }),
      ]);
      target = data.id;
    } else {
      const created = await prisma.automation.create({
        data: {
          workspaceId,
          status: "DRAFT",
          ...base,
          keywords: { create: rules },
        },
      });
      target = created.id;
    }
  } catch (error) {
    if (error instanceof WorkspaceUnavailableError) return failure(error.message);
    throw error;
  }

  revalidatePath("/app/automations");
  redirect(`/app/automations/${target}`);
}

export type TestResult = ActionState & {
  passed?: boolean;
  message?: string;
  intents?: string[];
  reason?: string;
};

/**
 * Runs a sample comment through the real engine and records the result.
 * Activation is only unlocked by a test that produced a reply.
 */
export async function testAutomation(
  _prev: TestResult,
  form: FormData,
): Promise<TestResult> {
  try {
    const { prisma, workspaceId } = await requireWorkspace();
    const id = String(form.get("id") ?? "");
    const comment = String(form.get("comment") ?? "").trim();
    if (!comment) return failure("Enter a sample comment to test with.");

    const automation = await prisma.automation.findFirst({
      where: { id, workspaceId },
      include: { keywords: true, campaign: true },
    });
    if (!automation) return failure("That automation no longer exists.");

    const business = await prisma.businessInformation.findUnique({
      where: { workspaceId },
    });

    const definitions: KeywordDefinition[] = automation.keywords.map((rule) => ({
      intentKey: rule.intentKey,
      keyword: rule.keyword,
      aliases: rule.aliases,
      fuzzy: rule.fuzzy,
    }));

    const templates: Record<string, string> = { any: automation.messageTemplate };
    for (const rule of automation.keywords) {
      if (rule.responseText) templates[rule.intentKey] = rule.responseText;
    }

    const composed = await createResponseEngine().compose({
      comment,
      username: "Rahul",
      campaignName: automation.campaign?.name ?? null,
      triggerMode: automation.triggerMode,
      keywordDefinitions: definitions,
      campaign: automation.campaign
        ? {
            price: automation.campaign.price,
            location: automation.campaign.location,
            link: automation.campaign.productLink,
            description: automation.campaign.details,
            brochure: automation.campaign.brochureUrl,
          }
        : null,
      globalBusiness: business
        ? {
            location: business.address,
            address: business.address,
            link: business.defaultLocationLink ?? business.website,
            description: business.generalInformation,
          }
        : null,
      businessInformationActive: Boolean(business?.isActive),
      templates,
    });

    await prisma.automation.update({
      where: { id },
      data: {
        lastTestedAt: composed.shouldReply ? new Date() : null,
        status: composed.shouldReply && automation.status === "DRAFT" ? "TESTING" : automation.status,
      },
    });

    revalidatePath(`/app/automations/${id}`);
    return {
      ok: true,
      passed: composed.shouldReply,
      message: composed.message,
      intents: composed.intents.map((intent) => intent.intentKey),
      reason: composed.reason,
    };
  } catch (error) {
    if (error instanceof WorkspaceUnavailableError) return failure(error.message);
    throw error;
  }
}

export async function activateAutomation(form: FormData) {
  const { prisma, workspaceId } = await requireWorkspace();
  const id = String(form.get("id") ?? "");

  const automation = await prisma.automation.findFirst({
    where: { id, workspaceId },
    select: { lastTestedAt: true },
  });
  // The product rule: no activation without a passing test.
  if (!automation?.lastTestedAt) return;

  await prisma.automation.update({
    where: { id },
    data: { status: "ACTIVE", activatedAt: new Date() },
  });
  revalidatePath("/app/automations");
  revalidatePath(`/app/automations/${id}`);
}

export async function pauseAutomation(form: FormData) {
  const { prisma, workspaceId } = await requireWorkspace();
  const id = String(form.get("id") ?? "");
  await prisma.automation.updateMany({
    where: { id, workspaceId },
    data: { status: "PAUSED" },
  });
  revalidatePath("/app/automations");
  revalidatePath(`/app/automations/${id}`);
}

export async function deleteAutomation(form: FormData) {
  const { prisma, workspaceId } = await requireWorkspace();
  const id = String(form.get("id") ?? "");
  await prisma.automation.deleteMany({ where: { id, workspaceId } });
  revalidatePath("/app/automations");
  redirect("/app/automations");
}
