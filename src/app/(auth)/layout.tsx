import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col bg-background-secondary">
      <header className="flex items-center justify-between px-4 py-4 sm:px-6">
        <Logo />
        <ThemeSwitcher />
      </header>
      <div className="flex flex-1 items-center justify-center px-4 pb-16">{children}</div>
      <p className="pb-6 text-center text-xs text-muted">
        <Link href="/privacy-policy">Privacy</Link> · <Link href="/terms-of-service">Terms</Link>
      </p>
    </div>
  );
}
