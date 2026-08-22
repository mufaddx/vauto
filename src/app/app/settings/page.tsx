import { notFound } from "next/navigation";
import { PasswordForm, ProfileForm } from "@/components/app/forms/settings-forms";
import { ConfigNotice } from "@/components/app/config-notice";
import { tryWorkspace } from "@/lib/workspace-context";
import { changePassword, updateProfile } from "@/lib/actions/account";

export default async function SettingsPage() {
  const context = await tryWorkspace("/app/settings");
  if (!context) return <ConfigNotice title="Settings" />;

  const [user, workspace] = await Promise.all([
    context.prisma.user.findUnique({ where: { id: context.session.sub } }),
    context.prisma.workspace.findUnique({ where: { id: context.workspaceId } }),
  ]);
  if (!user || !workspace) notFound();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <ProfileForm
        action={updateProfile}
        values={{
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          workspaceName: workspace.name,
        }}
      />

      <PasswordForm action={changePassword} />
    </div>
  );
}
