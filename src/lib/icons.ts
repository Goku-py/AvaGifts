import {
  Briefcase,
  Boxes,
  Coffee,
  Flame,
  Flower2,
  Gem,
  Gift,
  Handshake,
  Layers,
  Mail,
  MapPin,
  NotebookPen,
  Package,
  Palette,
  PartyPopper,
  PenTool,
  Phone,
  Ribbon,
  ShieldCheck,
  Sparkles,
  Timer,
  UserCheck,
  type LucideIcon,
} from "lucide-react";

/**
 * Registry of lucide icons referenced by name in site data.
 * Keeps `src/lib/data.ts` serialisable and the icon usage typed.
 */
const registry = {
  Gift,
  Coffee,
  Flame,
  NotebookPen,
  Flower2,
  Package,
  Sparkles,
  Briefcase,
  PartyPopper,
  PenTool,
  Gem,
  Layers,
  Ribbon,
  Boxes,
  Palette,
  Timer,
  Handshake,
  UserCheck,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof registry;

/** Direct registry access — stable component references, safe for render. */
export const iconRegistry = registry;

export function getIcon(name: IconName): LucideIcon {
  return registry[name];
}
