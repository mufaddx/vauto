"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireWorkspace, WorkspaceUnavailableError } from "@/lib/workspace-context";
import {
  createSessionToken,
  setSessionCookie,
  type SessionRole,
} from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  failure,
  optionalText,
  readForm,
  requiredText,
  zodFieldErrors,
  type ActionState,
} from "@/lib/actions/shared";

const profileSchema = z.object({
  firstName: requiredText("First name", 80),
  lastName: optionalText,
  workspaceName: requiredText("Workspace name", 80),
});

export async function updateProfile(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const { prisma, workspaceId, session } = await requireWorkspace("/app/settings");
    const parsed = profileSchema.safeParse(readForm(form));
    if (!parsed.success) {
      return failure("Check the highlighted fields.", zodFieldErrors(parsed.error));
    }

    const user = await prisma.user.update({
      where: { id: session.sub },
      data: { firstName: parsed.data.firstName, lastName: parsed.data.lastName },
    });
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { name: parsed.data.workspaceName },
    });

    // The session carries the display name, so it has to be reissued.
    await setSessionCookie(
      await createSessionToken({
        sub: user.id,
        email: user.email,
        firstName: user.firstName,
        role: user.role as SessionRole,
        workspaceId,
      }),
    );

    revalidatePath("/app/settings");
    return { ok: true };
  } catch (error) {
    if (error instanceof WorkspaceUnavailableError) return failure(error.message);
    throw error;
  }
}

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password."),
  newPassword: z.string().min(8, "The new password must be at least 8 characters."),
});

export async function changePassword(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const { prisma, session } = await requireWorkspace("/app/settings");
    const parsed = passwordSchema.safeParse(readForm(form));
    if (!parsed.success) {
      return failure("Check the highlighted fields.", zodFieldErrors(parsed.error));
    }

    const user = await prisma.user.findUnique({ where: { id: session.sub } });
    if (!user) return failure("This account no longer exists.");

    // Accounts created through Google or Facebook have no password to compare.
    if (!user.passwordHash) {
      return failure(
        "This account signs in with Google or Facebook. Use the forgot password flow to set one.",
      );
    }
    if (!(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
      return failure("The current password did not match.", {
        currentPassword: "Incorrect password.",
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(parsed.data.newPassword) },
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof WorkspaceUnavailableError) return failure(error.message);
    throw error;
  }
}
