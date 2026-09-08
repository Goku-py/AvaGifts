import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EyebrowProps {
  children: ReactNode;
  /** Use "dark" on navy/gradient bands. */
  tone?: "light" | "dark";
  className?: string;
}

/** Small uppercase label preceded by a 24px accent rule. */
export function Eyebrow({ children, tone = "light", className }: EyebrowProps) {
  return (
    <p
      className={cn(
        "flex items-center gap-3 text-caption uppercase tracking-[0.14em]",
        tone === "dark" ? "text-white/60" : "text-muted",
        className,
      )}
    >
      <span aria-hidden="true" className="h-px w-6 shrink-0 bg-interactive" />
      {children}
    </p>
  );
}
