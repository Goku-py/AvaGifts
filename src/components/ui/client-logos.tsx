import type { ComponentType } from "react";

/*
 * Placeholder client marks.
 *
 * These are simple geometric logos drawn to suit the placeholder company
 * names in `trusted.customers` — they are OUR artwork, not any real
 * company's brand asset. When real clients are confirmed, replace both the
 * name in data.ts and the mark here with the supplied logo, and only once
 * permission to display it is on file.
 *
 * All marks inherit `currentColor` so the section controls the colour, and
 * all are drawn on a 32x32 grid so they optically match at any size.
 */

interface MarkProps {
  className?: string;
}

/** Northwind — a compass rose, for the "north" in the name. */
function NorthwindMark({ className }: MarkProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={className}>
      <circle cx="16" cy="16" r="12.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M16 6.5 19.2 15 16 25.5 12.8 15 16 6.5Z"
        fill="currentColor"
        opacity="0.9"
      />
      <path d="M6.5 16h5M20.5 16h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** Meridian — a globe crossed by its meridian line. */
function MeridianMark({ className }: MarkProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={className}>
      <circle cx="16" cy="16" r="12.5" stroke="currentColor" strokeWidth="1.8" />
      <ellipse cx="16" cy="16" rx="5.5" ry="12.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.5 16h25" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** Lumen — a light source, rays radiating from a solid core. */
function LumenMark({ className }: MarkProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={className}>
      <circle cx="16" cy="16" r="5.5" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M16 3v4.5M16 24.5V29M3 16h4.5M24.5 16H29" />
        <path d="m7.4 7.4 3.2 3.2M21.4 21.4l3.2 3.2M24.6 7.4l-3.2 3.2M10.6 21.4l-3.2 3.2" opacity="0.55" />
      </g>
    </svg>
  );
}

/** Kestrel — a bird in flight, reduced to two chevron wings. */
function KestrelMark({ className }: MarkProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={className}>
      <path
        d="M3 19.5 16 8l13 11.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 25 16 18.5 23.5 25"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.5"
      />
    </svg>
  );
}

export type ClientLogoName = "northwind" | "meridian" | "lumen" | "kestrel";

const registry: Record<ClientLogoName, ComponentType<MarkProps>> = {
  northwind: NorthwindMark,
  meridian: MeridianMark,
  lumen: LumenMark,
  kestrel: KestrelMark,
};

export function getClientLogo(name: ClientLogoName) {
  return registry[name];
}
