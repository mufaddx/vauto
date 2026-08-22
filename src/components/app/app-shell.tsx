"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  CreditCard,
  Home,
  Inbox,
  Camera,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Share2,
  Users,
  Workflow,
  LogOut,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { cn } from "@/lib/utils";

const items = [
  { href: "/app", label: "Overview", icon: Home },
  { href: "/app/campaigns", label: "Campaigns", icon: LayoutDashboard },
  { href: "/app/automations", label: "Automations", icon: Workflow },
  { href: "/app/inbox", label: "Inbox", icon: Inbox },
  { href: "/app/contacts", label: "Contacts", icon: Users },
  { href: "/app/templates", label: "Templates", icon: MessageSquare },
  { href: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/app/channels", label: "Channels", icon: Share2 },
  { href: "/app/channels/instagram", label: "Instagram", icon: Camera },
  { href: "/app/channels/facebook", label: "Facebook", icon: Share2 },
  { href: "/app/business-information", label: "Business Information", icon: Building2 },
  { href: "/app/billing", label: "Billing", icon: CreditCard },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

export type AppShellUser = { firstName: string; email: string };

export function AppShell({
  children,
  user,
}: {
  children: ReactNode;
  user: AppShellUser;
}) {
  const pathname = usePathname();
  return (
    <div className="min-h-full bg-background-secondary">
      <aside className="fixed inset-y-0 left-0 hidden w-64 overflow-y-auto border-r border-border bg-card px-4 py-5 lg:block">
        <Logo />
        <nav className="mt-8 space-y-1" aria-label="Application">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-secondary",
                  active && "bg-accent-soft text-accent",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur-md">
          <p className="text-sm font-medium lg:hidden">VIDLIX</p>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{user.firstName}</p>
              <p className="text-xs leading-tight text-secondary">{user.email}</p>
            </div>
            <ThemeSwitcher />
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm text-secondary hover:text-primary"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </form>
          </div>
        </header>
        <div className="px-4 pb-24 pt-6 sm:px-6">{children}</div>
        <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-card lg:hidden" aria-label="Mobile">
          {[items[0], items[1], items[2], items[3], items[12]].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center gap-1 py-2 text-[11px] text-secondary"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
