import { iconRegistry, type IconName } from "@/lib/icons";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Deterministic seeded randomness                                     */
/* ------------------------------------------------------------------ */

/** xmur3 string hash → 32-bit seed. */
function hashSeed(seed: string): number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

/** mulberry32 PRNG — small, fast, deterministic. */
function mulberry32(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ */
/* Palette variants — soft cream/ivory washes                          */
/* ------------------------------------------------------------------ */

const GRADIENTS = [
  "linear-gradient(140deg, #f7f3ea 0%, #efe9dc 100%)",
  "linear-gradient(140deg, #f6f1e7 0%, #eae3d3 100%)",
  "linear-gradient(140deg, #f5f3ec 0%, #e6e6dd 100%)",
  "linear-gradient(140deg, #f8f4ec 0%, #ece4d1 100%)",
  "linear-gradient(140deg, #f6f2ea 0%, #e8e7de 100%)",
] as const;

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

interface ProductArtProps {
  /** Deterministic seed — same seed always renders the same composition. */
  seed: string;
  icon: IconName;
  /** Tailwind aspect-ratio class. Defaults to 4:3. */
  aspect?: string;
  className?: string;
  iconClassName?: string;
}

/**
 * Elegant abstract stand-in for product photography: a seeded cream
 * gradient, quiet geometric shapes, a centred line-art icon and a
 * whisper of paper grain. Pure CSS/SVG — no raster assets.
 *
 * Wrap the parent in Tailwind's `group` to get the 1.03 hover zoom.
 */
export function ProductArt({
  seed,
  icon,
  aspect = "aspect-[4/3]",
  className,
  iconClassName,
}: ProductArtProps) {
  const random = mulberry32(hashSeed(seed));

  const gradient = GRADIENTS[Math.floor(random() * GRADIENTS.length)];

  const blobLeft = 6 + random() * 26;
  const blobTop = 4 + random() * 30;
  const blobSize = 52 + random() * 34;

  const ringRight = 4 + random() * 18;
  const ringBottom = 8 + random() * 26;
  const ringSize = 84 + random() * 72;

  const dotLeft = 12 + random() * 70;
  const dotTop = 12 + random() * 70;

  const Icon = iconRegistry[icon];

  return (
    <div
      aria-hidden="true"
      className={cn("relative overflow-hidden rounded-xl", aspect, className)}
    >
      <div
        className={cn(
          "absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100",
        )}
        style={{ backgroundImage: gradient }}
      >
        {/* soft light blob */}
        <div
          className="absolute rounded-full bg-white/55 blur-2xl"
          style={{
            left: `${blobLeft}%`,
            top: `${blobTop}%`,
            width: `${blobSize}%`,
            aspectRatio: "1",
          }}
        />
        {/* thin gold ring */}
        <div
          className="absolute rounded-full border border-gold/25"
          style={{ right: `${ringRight}%`, bottom: `${ringBottom}%`, width: `${ringSize}px`, height: `${ringSize}px` }}
        />
        {/* gold accent dot */}
        <div
          className="absolute size-1.5 rounded-full bg-gold/40"
          style={{ left: `${dotLeft}%`, top: `${dotTop}%` }}
        />
        {/* centred line-art medallion */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex size-16 items-center justify-center rounded-full border border-ink/[0.06] bg-white/70 shadow-[0_2px_10px_rgb(23_25_30/0.06)] sm:size-20">
            <Icon strokeWidth={1.5} className={cn("size-7 text-accent sm:size-8", iconClassName)} />
          </div>
        </div>
        {/* paper grain */}
        <div className="art-grain pointer-events-none absolute inset-0 opacity-50 mix-blend-multiply" />
      </div>
    </div>
  );
}
