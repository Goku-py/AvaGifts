import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends ComponentPropsWithoutRef<"div"> {
  /** Adds the hover lift + shadow bloom micro-interaction. Pair with `group` usage as needed. */
  hoverable?: boolean;
  children: ReactNode;
}

/** Base surface: white card + shadow, hairline divider border. */
export function Card({ hoverable = false, className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-divider bg-white shadow-card",
        hoverable &&
          "transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-lift motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
