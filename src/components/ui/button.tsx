import { ArrowRight } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Shared styles                                                       */
/* ------------------------------------------------------------------ */

type ButtonVariant = "primary" | "gradient" | "secondary" | "ghost" | "inverse";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonStyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  arrow?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-interactive text-white hover:bg-interactive-hover active:bg-interactive-active active:translate-y-px",
  /* Brand gradient — hero sections, CTAs, highlight panels only. */
  gradient: "bg-gradient-primary text-white hover:opacity-90 active:translate-y-px",
  secondary:
    "border border-neutral-300 bg-white text-text-primary hover:border-neutral-400 hover:bg-hover-surface active:translate-y-px",
  ghost: "text-text-primary hover:bg-hover-surface",
  /* Quiet action on dark / gradient bands. */
  inverse:
    "border border-white/25 bg-transparent text-white hover:border-white/45 hover:bg-white/10 active:translate-y-px",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 gap-1.5 px-4 text-sm font-semibold",
  md: "h-11 gap-2 px-5 text-button",
  lg: "h-12 gap-2 px-7 text-button",
};

function buttonClasses({ variant = "primary", size = "md" }: ButtonStyleProps) {
  return cn(
    /* font-ui = Inter. The design sets content in Jost but every button
       label in Inter Semi Bold, so the split lives here rather than at
       each call site. */
    "group inline-flex shrink-0 items-center justify-center rounded-full font-ui",
    "transition-[background-color,border-color,color,box-shadow,opacity,transform] duration-200 ease-out",
    "disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none motion-reduce:transition-none",
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
