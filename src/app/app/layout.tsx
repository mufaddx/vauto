import { AppShell } from "@/components/app/app-shell";
import { requireSession } from "@/lib/auth/session";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await requireSession("/app");
  return (
    <AppShell user={{ firstName: session.firstName, email: session.email }}>
      {children}
    </AppShell>
  );
}
