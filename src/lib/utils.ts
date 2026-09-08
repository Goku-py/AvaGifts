import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * The design system's typography classes (globals.css `@layer components`) are
 * named `text-*`, which collides with tailwind-merge's `text-{color}` group.
 * Left unconfigured, `cn("text-h2", "text-text-primary")` silently drops
 * `text-h2` and the heading renders at body size.
 *
 * Registering them as font-size classes makes them conflict only with each
 * other, so a size and a colour can coexist.
 */
const TYPOGRAPHY_CLASSES = [
  "display",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "body-lg",
  "body",
  "small",
  "caption",
  "button",
] as const;

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: [...TYPOGRAPHY_CLASSES] }],
    },
  },
});

/** Merge conditional class names, deduping conflicting Tailwind utilities. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
