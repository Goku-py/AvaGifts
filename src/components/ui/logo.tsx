import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The AvadheshCo lockup, exported from Figma and trimmed to its content box.
 * Intrinsic size is 725×168; everything below derives from that ratio, so
 * re-exporting at a different size only needs these two numbers changed.
 */
const LOGO_SRC = "/design/logo-avadheshco.png";
const LOGO_WIDTH = 725;
const LOGO_HEIGHT = 168;

interface LogoProps {
  /**
   * Single-colour version for the dark bands. The lockup is blue-on-yellow,
   * which sits at roughly 2:1 against #121212 — well under the 3:1 a logo
   * needs to stay readable — so on dark it renders as a white silhouette.
   */
  mono?: boolean;
  className?: string;
  priority?: boolean;
}

/** AvadheshCo wordmark: yellow "A" mark + name. */
export function Logo({ mono = false, className, priority }: LogoProps) {
  return (
    <Image
      src={LOGO_SRC}
      alt="AvadheshCo"
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      priority={priority}
      sizes="195px"
      className={cn(
        "h-9 w-auto sm:h-[45px]",
        mono && "brightness-0 invert",
        className,
      )}
    />
  );
}
