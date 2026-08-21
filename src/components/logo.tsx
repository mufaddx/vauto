import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-sm font-semibold text-white">
        V
      </span>
      <span className="text-[17px] font-semibold tracking-tight">VIDLIX</span>
    </Link>
  );
}
