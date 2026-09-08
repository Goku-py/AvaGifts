"use client";

import { motion, MotionConfig, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { REVEAL_DURATION } from "@/lib/motion";

interface RevealProps {
  children: ReactNode;
  /** Delay in seconds — use `index * STAGGER` for lists. */
  delay?: number;
  className?: string;
}

/**
 * Scroll-reveal: fade + 16px rise, 0.55s, signature ease.
 * Honours prefers-reduced-motion by rendering static content.
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-64px" }}
      transition={{ duration: REVEAL_DURATION, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

/**
 * App-level motion defaults: disables transform/layout animations for
 * users who prefer reduced motion (opacity fades still resolve). Wrap
 * once in the root layout tree.
 */
export function MotionDefaults({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
