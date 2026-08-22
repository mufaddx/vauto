"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireWorkspace, WorkspaceUnavailableError } from "@/lib/workspace-context";
import {
  failure,
  optionalText,
  readForm,
  requiredText,
  zodFieldErrors,
  type ActionState,
} from "@/lib/actions/shared";

const CHANNELS = ["INSTAGRAM", "FACEBOOK", "BOTH"] as const;
const STATUSES = ["DRAFT", "ACTIVE", "PAUSED", "COMPLETED"] as const;

const campaignSchema = z.object({
  name: requiredText("Campaign name"),
  description: optionalText,
  category: optionalText,
  channel: z.enum(CHANNELS).default("INSTAGRAM"),
  price: optionalText,
  location: optionalText,
  productLink: optionalText,
  details: optionalText,
  faq: optionalText,
  contactInfo: optionalText,
  cta: optionalText,
  brochureUrl: optionalText,
});

export async function createCampaign(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  let campaignId: string;
  try {
    const { prisma, workspaceId } = await requireWorkspace("/app/campaigns/new");
    const parsed = campaignSchema.safeParse(readForm(form));
    if (!parsed.success) {
      return failure("Check the highlighted fields.", zodFieldErrors(parsed.error));
    }

    const campaign = await prisma.campaign.create({
      data: { workspaceId, status: "DRAFT", ...parsed.data },
    });
    campaignId = campaign.id;
  } catch (error) {
    if (error instanceof WorkspaceUnavailableError) return failure(error.message);
    throw error;
  }

  revalidatePath("/app/campaigns");
  redirect(`/app/campaigns/${campaignId}`);
}

export async function updateCampaign(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const { prisma, workspaceId } = await requireWorkspace();
    const id = String(form.get("id") ?? "");
    const parsed = campaignSchema.safeParse(readForm(form));
    if (!parsed.success) {
      return failure("Check the highlighted fields.", zodFieldErrors(parsed.error));
    }

    // Scoped by workspaceId so one workspace can never edit another's rows.
    const updated = await prisma.campaign.updateMany({
      where: { id, workspaceId },
      data: { ...parsed.data, lastActivityAt: new Date() },
    });
    if (updated.count === 0) return failure("That campaign no longer exists.");

    revalidatePath("/app/campaigns");
    revalidatePath(`/app/campaigns/${id}`);
    return { ok: true };
  } catch (error) {
    if (error instanceof WorkspaceUnavailableError) return failure(error.message);
    throw error;
  }
}

export async function setCampaignStatus(form: FormData) {
  const { prisma, workspaceId } = await requireWorkspace();
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "");
  if (!STATUSES.includes(status as (typeof STATUSES)[number])) return;

  await prisma.campaign.updateMany({
    where: { id, workspaceId },
    data: { status: status as (typeof STATUSES)[number], lastActivityAt: new Date() },
  });
  revalidatePath("/app/campaigns");
  revalidatePath(`/app/campaigns/${id}`);
}

export async function deleteCampaign(form: FormData) {
  const { prisma, workspaceId } = await requireWorkspace();
  const id = String(form.get("id") ?? "");
  await prisma.campaign.deleteMany({ where: { id, workspaceId } });
  revalidatePath("/app/campaigns");
  redirect("/app/campaigns");
}

export async function duplicateCampaign(form: FormData) {
  const { prisma, workspaceId } = await requireWorkspace();
  const id = String(form.get("id") ?? "");
  const source = await prisma.campaign.findFirst({ where: { id, workspaceId } });
  if (!source) return;

  await prisma.campaign.create({
    data: {
      workspaceId,
      name: `${source.name} (copy)`,
      status: "DRAFT",
      description: source.description,
      category: source.category,
      channel: source.channel,
      startDate: source.startDate,
      endDate: source.endDate,
      price: source.price,
      location: source.location,
      details: source.details,
      productLink: source.productLink,
      brochureUrl: source.brochureUrl,
      faq: source.faq,
      contactInfo: source.contactInfo,
      cta: source.cta,
    },
  });
  revalidatePath("/app/campaigns");
}

/** Links a published Instagram/Facebook post to a campaign. */
const postSchema = z.object({
  campaignId: requiredText("Campaign"),
  platform: z.enum(["INSTAGRAM", "FACEBOOK"]),
  externalId: requiredText("Post id"),
  title: optionalText,
  permalink: optionalText,
  price: optionalText,
  location: optionalText,
  productLink: optionalText,
  description: optionalText,
  brochureUrl: optionalText,
});

export async function addCampaignPost(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const { prisma, workspaceId } = await requireWorkspace();
    const parsed = postSchema.safeParse(readForm(form));
    if (!parsed.success) {
      return failure("Check the highlighted fields.", zodFieldErrors(parsed.error));
    }

    const campaign = await prisma.campaign.findFirst({
      where: { id: parsed.data.campaignId, workspaceId },
      select: { id: true },
    });
    if (!campaign) return failure("That campaign no longer exists.");

    await prisma.campaignPost.upsert({
      where: {
        campaignId_platform_externalId: {
          campaignId: parsed.data.campaignId,
          platform: parsed.data.platform,
          externalId: parsed.data.externalId,
        },
      },
      create: parsed.data,
      update: parsed.data,
    });

    revalidatePath(`/app/campaigns/${parsed.data.campaignId}`);
    return { ok: true };
  } catch (error) {
    if (error instanceof WorkspaceUnavailableError) return failure(error.message);
    throw error;
  }
}

export async function deleteCampaignPost(form: FormData) {
  const { prisma, workspaceId } = await requireWorkspace();
  const id = String(form.get("postId") ?? "");
  const campaignId = String(form.get("campaignId") ?? "");

  // Confirm ownership through the parent campaign before deleting.
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, workspaceId },
    select: { id: true },
  });
  if (!campaign) return;

  await prisma.campaignPost.deleteMany({ where: { id, campaignId } });
  revalidatePath(`/app/campaigns/${campaignId}`);
}
