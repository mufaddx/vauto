"use server";

import { revalidatePath } from "next/cache";
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

/* -------------------------------------------------------------------------- */
/* Templates                                                                   */
/* -------------------------------------------------------------------------- */

const templateSchema = z.object({
  id: optionalText,
  name: requiredText("Template name"),
  channel: z
    .string()
    .trim()
    .transform((value) => (value === "INSTAGRAM" || value === "FACEBOOK" ? value : null))
    .nullable(),
  body: requiredText("Message body", 2000),
});

export async function saveTemplate(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const { prisma, workspaceId } = await requireWorkspace("/app/templates");
    const parsed = templateSchema.safeParse(readForm(form));
    if (!parsed.success) {
      return failure("Check the highlighted fields.", zodFieldErrors(parsed.error));
    }
    const { id, ...data } = parsed.data;

    if (id) {
      const updated = await prisma.template.updateMany({
        where: { id, workspaceId },
        data,
      });
      if (updated.count === 0) return failure("That template no longer exists.");
    } else {
      await prisma.template.create({ data: { workspaceId, ...data } });
    }

    revalidatePath("/app/templates");
    return { ok: true };
  } catch (error) {
    if (error instanceof WorkspaceUnavailableError) return failure(error.message);
    throw error;
  }
}

export async function deleteTemplate(form: FormData) {
  const { prisma, workspaceId } = await requireWorkspace();
  const id = String(form.get("id") ?? "");
  await prisma.template.deleteMany({ where: { id, workspaceId } });
  revalidatePath("/app/templates");
}

/* -------------------------------------------------------------------------- */
/* Business information                                                        */
/* -------------------------------------------------------------------------- */

const businessSchema = z.object({
  businessName: optionalText,
  businessType: optionalText,
  description: optionalText,
  address: optionalText,
  phone: optionalText,
  email: optionalText,
  website: optionalText,
  defaultLocationLink: optionalText,
  generalInformation: optionalText,
  defaultResponseMessage: optionalText,
});

export async function saveBusinessInformation(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const { prisma, workspaceId } = await requireWorkspace("/app/business-information");
    const parsed = businessSchema.safeParse(readForm(form));
    if (!parsed.success) {
      return failure("Check the highlighted fields.", zodFieldErrors(parsed.error));
    }

    await prisma.businessInformation.upsert({
      where: { workspaceId },
      create: { workspaceId, ...parsed.data },
      update: parsed.data,
    });

    revalidatePath("/app/business-information");
    return { ok: true };
  } catch (error) {
    if (error instanceof WorkspaceUnavailableError) return failure(error.message);
    throw error;
  }
}

/**
 * The global layer only feeds replies once it is explicitly activated, so a
 * half-filled profile can never leak into customer messages.
 */
export async function setBusinessInformationActive(form: FormData) {
  const { prisma, workspaceId } = await requireWorkspace();
  const active = String(form.get("active") ?? "") === "true";

  await prisma.businessInformation.upsert({
    where: { workspaceId },
    create: { workspaceId, isActive: active, activatedAt: active ? new Date() : null },
    update: { isActive: active, activatedAt: active ? new Date() : null },
  });
  revalidatePath("/app/business-information");
}

/* -------------------------------------------------------------------------- */
/* Contacts and tags                                                           */
/* -------------------------------------------------------------------------- */

export async function setContactStatus(form: FormData) {
  const { prisma, workspaceId } = await requireWorkspace();
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "");
  if (!["open", "engaged", "converted", "closed"].includes(status)) return;

  await prisma.contact.updateMany({ where: { id, workspaceId }, data: { status } });
  revalidatePath("/app/contacts");
}

export async function deleteContact(form: FormData) {
  const { prisma, workspaceId } = await requireWorkspace();
  const id = String(form.get("id") ?? "");
  await prisma.contact.deleteMany({ where: { id, workspaceId } });
  revalidatePath("/app/contacts");
}

export async function addContactTag(form: FormData) {
  const { prisma, workspaceId } = await requireWorkspace();
  const contactId = String(form.get("contactId") ?? "");
  const name = String(form.get("tag") ?? "").trim();
  if (!name) return;

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, workspaceId },
    select: { id: true },
  });
  if (!contact) return;

  const tag = await prisma.tag.upsert({
    where: { workspaceId_name: { workspaceId, name } },
    create: { workspaceId, name },
    update: {},
  });

  await prisma.contactTag.upsert({
    where: { contactId_tagId: { contactId, tagId: tag.id } },
    create: { contactId, tagId: tag.id },
    update: {},
  });
  revalidatePath("/app/contacts");
}

export async function removeContactTag(form: FormData) {
  const { prisma, workspaceId } = await requireWorkspace();
  const contactId = String(form.get("contactId") ?? "");
  const tagId = String(form.get("tagId") ?? "");

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, workspaceId },
    select: { id: true },
  });
  if (!contact) return;

  await prisma.contactTag.deleteMany({ where: { contactId, tagId } });
  revalidatePath("/app/contacts");
}

/* -------------------------------------------------------------------------- */
/* Inbox                                                                       */
/* -------------------------------------------------------------------------- */

export async function setConversationStatus(form: FormData) {
  const { prisma, workspaceId } = await requireWorkspace();
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "");
  if (!["OPEN", "ASSIGNED", "RESOLVED"].includes(status)) return;

  await prisma.conversation.updateMany({
    where: { id, workspaceId },
    data: { status: status as "OPEN" | "ASSIGNED" | "RESOLVED" },
  });
  revalidatePath("/app/inbox");
}

export async function markConversationRead(form: FormData) {
  const { prisma, workspaceId } = await requireWorkspace();
  const id = String(form.get("id") ?? "");
  await prisma.conversation.updateMany({
    where: { id, workspaceId },
    data: { unreadCount: 0 },
  });
  revalidatePath("/app/inbox");
}
