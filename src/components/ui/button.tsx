import { ArrowRight } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Shared styles                                                       */
/* ------------------------------------------------------------------ */

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonStyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  arrow?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-accent text-paper hover:bg-accent-ink active:translate-y-px",
  secondary:
    "border border-ink/15 bg-transparent text-ink hover:border-ink/30 hover:bg-ink/[0.04] active:translate-y-px",
  ghost: "text-ink hover:bg-ink/[0.06]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 gap-1.5 px-4 text-sm",
  md: "h-11 gap-2 px-5 text-sm",
  lg: "h-12 gap-2 px-7 text-base",
};

function buttonClasses({ variant = "primary", size = "md" }: ButtonStyleProps) {
  return cn(
    "group inline-flex shrink-0 items-center justify-center rounded-full font-medium",
    "transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out",
    "disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none",
    variantClasses[variant],
    sizeClasses[size],
  );
}

function Arrow({ className }: { className?: string }) {
  return (
    <ArrowRight
      aria-hidden="true"
      className={cn(
        "size-4 transition-transform duration-200 ease-out group-hover:translate-x-1 motion-reduce:translate-x-0 motion-reduce:transition-none",
        className,
      )}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Button (native <button>)                                            */
/* ------------------------------------------------------------------ */

export type ButtonProps = ButtonStyleProps & ComponentPropsWithoutRef<"button">;

export function Button({
  variant,
  size,
  arrow,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={cn(buttonClasses({ variant, size, arrow }), className)} {...rest}>
      {children}
      {arrow ? <Arrow /> : null}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* ButtonLink (anchor styled as a button)                              */
/* ------------------------------------------------------------------ */

export type ButtonLinkProps = ButtonStyleProps & ComponentPropsWithoutRef<"a">;

export function ButtonLink({
  variant,
  size,
  arrow,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <a className={cn(buttonClasses({ variant, size, arrow }), className)} {...rest}>
      {children}
      {arrow ? <Arrow /> : null}
    </a>
  );
}
