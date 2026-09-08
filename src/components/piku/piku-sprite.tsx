"use client";

import type { PikuEmotion } from "./use-piku-brain";

/* ------------------------------------------------------------------ *
 * Piku Flat 2D Sprite — Duolingo-style penguin mascot
 *
 * Flat, bold shapes. Solid fills only. No gradients, no filters, no 3D.
 * Office dress: blue shirt, yellow tie, black pants, glasses.
 *
 * viewBox 0 0 120 130 — squat proportions, large head, small wings
 * --rx/--ry/--rz cascade from .piku-btn via RAF. No JS transforms here.
 * Pupils follow --pupil-x/y + --pupil-scale.
 * Ground shadows isolated outside <svg> as CSS siblings.
 * ------------------------------------------------------------------ */

const INK = "#1B1E25";
const CREAM = "#F5F0E8";
const WHITE = "#ffffff";
/* AvadheshCo palette: shirt = interactive #1273EB, tie = accent #FFDE59,
   beak/feet stay in the orange family sanctioned by Gradient 3 (#FFAA71). */
const SHIRT = "#1273EB";
const TIE = "#FFDE59";
const BEAK = "#FF9A4D";
const FOOT = "#FF9A4D";
const GLASS = "#1B1E25";
const BLUSH = "#d4a5a5";
const EXCITED_STAR = "#FFDE59";
/* Sweat lines. Was a stray #7ec8c8 from the previous brand; the mint from
   Gradient 3 is the palette's own cool accent and reads the same. */
const NERVOUS_MINT = "#51F8B0";

function DepthLayer({
  z,
  children,
  className,
}: {
  z: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <g
      className={`piku-depth-layer ${className ?? ""}`}
      data-layer={z}
      style={
        {
          "--layer-z": z,
          "--layer-idx": z + 4,
        } as React.CSSProperties
      }
    >
      {children}
    </g>
  );
}

export function PikuSprite({ emotion }: { emotion: PikuEmotion }) {
  const isSleepy = emotion === "sleepy";
  const isHappy = emotion === "happy";
  const isSurprised = emotion === "surprised";
  const isThinking = emotion === "thinking";
  const isExcited = emotion === "excited";
  const isProud = emotion === "proud";
  const isNervous = emotion === "nervous";
  const isPeeking = emotion === "peeking";

  return (
    <>
      <svg
        viewBox="0 0 120 130"
        className={`piku-svg piku--${emotion}`}
        aria-hidden="true"
        focusable="false"
        style={{ transformOrigin: "60px 90px" } as React.CSSProperties}
      >
        {/* Layer: background elements */}
        <DepthLayer z={-2}>
          {/* Body — large rounded shape */}
          <path
            d="M60 19 Q39 19 29 51 Q25 77 33 99 Q45 123 60 123 Q75 123 87 99 Q95 77 91 51 Q81 19 60 19"
            fill={INK}
          />
          {/* Pants area */}
          <path
            d="M37.5 93 Q34 100 39 106 L81 106 Q86 100 82.5 93 Z"
            fill={INK}
          />
        </DepthLayer>

        {/* Layer: body details */}
        <DepthLayer z={-1}>
          {/* Body outline */}
          <path
            d="M60 19 Q39 19 29 51 Q25 77 33 99 Q45 123 60 123 Q75 123 87 99 Q95 77 91 51 Q81 19 60 19"
            fill="none"
            stroke={INK}
            strokeWidth={0.3}
            opacity={0.15}
          />

          {/* Pants */}
          <path
            d="M37.5 93 Q33 100 38 106 L82 106 Q87 100 82.5 93 Z"
            fill="#151820"
          />
          <path d="M60 93.5 L60 106" stroke="#0f1115" strokeWidth={0.5} opacity={0.4} strokeLinecap="round" />

          {/* Belt */}
          <rect x={35} y={92} width={50} height={5} rx={1} fill="#2E3440" />
          {/* Belt buckle */}
          <rect x={54} y={92} width={12} height={5} rx={1} fill="#D8DDE6" />
          <rect x={56.5} y={93} width={7} height={3} rx={0.5} fill="#1B1E25" />
        </DepthLayer>

        {/* Layer: shirt, belly, collar, tie */}
        <DepthLayer z={0}>
          {/* Shirt panel */}
          <path
            d="M60 42 Q43 42 37 61 Q34 84 38 93 L82 93 Q86 84 83 61 Q77 42 60 42"
            fill={SHIRT}
          />

          {/* Collar — simplified triangles */}
          <path d="M60 56 L48 60 L52 68 L60 61 Z" fill={WHITE} />
          <path d="M60 56 L72 60 L68 68 L60 61 Z" fill={WHITE} />

          {/* Placket */}
          <rect x={58} y={61} width={4} height={31} rx={0.5} fill={WHITE} />
          {/* Buttons */}
          <circle cx={60} cy={67} r={1.2} fill="#2E3440" />
          <circle cx={60} cy={76} r={1.2} fill="#2E3440" />
          <circle cx={60} cy={85} r={1.2} fill="#2E3440" />

          {/* Tie knot */}
          <path d="M60 63 L54 66 L56 72 L64 72 L66 66 Z" fill={TIE} />
          {/* Tie tail */}
          <g
            className="piku-tie-tail piku-scarf-tail"
            style={
              {
                transformOrigin: "60px 72px",
                transform: "rotate(calc(var(--scarf-ry, 0) * 0.42deg))",
              } as React.CSSProperties
            }
          >
            <path d="M57 72 L55 92 L60 98 L65 92 L63 72 Z" fill={TIE} />
          </g>
        </DepthLayer>

        {/* Layer: face — eyes, beak, glasses */}
        <DepthLayer z={1}>
          {/* Face background — cream circle */}
          <ellipse cx={60} cy={43} rx={18} ry={15} fill={CREAM} />

          {/* Eyes — big, expressive, Duolingo-style */}
          <g className="piku-eyes">
            {/* White eye circles */}
            <ellipse cx={44} cy={50} rx={10} ry={9} fill={WHITE} />
            <ellipse cx={76} cy={50} rx={10} ry={9} fill={WHITE} />

            {/* Pupils — track gaze */}
            <g
              className="piku-pupils"
              style={
                {
                  transform: "translate(var(--pupil-x, 0) var(--pupil-y, 0)) scale(var(--pupil-scale, 1))",
                  transformOrigin: "60px 50px",
                } as React.CSSProperties
              }
            >
              {/* Pupil */}
              <circle cx={44} cy={51} r={5} fill={INK} />
              <circle cx={76} cy={51} r={5} fill={INK} />
              {/* Shine dots */}
              <circle cx={42} cy={49} r={1.5} fill={WHITE} />
              <circle cx={74} cy={49} r={1.5} fill={WHITE} />
              {/* Tiny secondary shine */}
              <circle cx={46} cy={52.5} r={0.7} fill={WHITE} opacity={0.6} />
              <circle cx={78} cy={52.5} r={0.7} fill={WHITE} opacity={0.6} />
            </g>

            {/* Blink lids */}
            <g className="piku-lids" opacity={0} pointerEvents="none">
              <ellipse cx={44} cy={50} rx={10} ry={9} fill={INK} />
              <ellipse cx={76} cy={50} rx={10} ry={9} fill={INK} />
            </g>

            {/* Sleepy eyes — half-closed */}
            {isSleepy && (
              <g fill={INK} opacity={0.88}>
                <path d="M34 47 Q44 44 54 47 L54 49 Q44 46 34 49 Z" />
                <path d="M66 47 Q76 44 86 47 L86 49 Q76 46 66 49 Z" />
              </g>
            )}

            {/* Happy eyes — squint arcs */}
            {isHappy && (
              <g stroke={INK} strokeWidth={2.4} strokeLinecap="round" fill="none" opacity={0.95}>
                <path d="M37 52 Q44 45 51 52" />
                <path d="M69 52 Q76 45 83 52" />
              </g>
            )}

            {/* Surprised — bigger outline */}
            {isSurprised && (
              <g fill="none" stroke={INK} strokeWidth={1.2} opacity={0.95}>
                <ellipse cx={44} cy={50} rx={11} ry={10} />
                <ellipse cx={76} cy={50} rx={11} ry={10} />
              </g>
            )}

            {/* Thinking — one eye bigger */}
            {isThinking && (
              <g fill="none" stroke={INK} strokeWidth={0.9} opacity={0.5}>
                <ellipse cx={44} cy={50} rx={10} ry={8} />
                <ellipse cx={76} cy={49} rx={10} ry={7} />
              </g>
            )}

            {/* Excited — star eyes */}
            {isExcited && (
              <g className="piku-excited-eyes">
                <circle cx={44} cy={51} r={6} fill={EXCITED_STAR} opacity={0.95} />
                <circle cx={76} cy={51} r={6} fill={EXCITED_STAR} opacity={0.95} />
                <circle cx={44} cy={51} r={2.7} fill={INK} />
                <circle cx={76} cy={51} r={2.7} fill={INK} />
              </g>
            )}

            {/* Proud — half-closed */}
            {isProud && (
              <g fill={INK} opacity={0.82}>
                <path d="M34 48 Q44 46 54 48 L54 50 Q44 47.5 34 50 Z" />
                <path d="M66 48 Q76 46 86 48 L86 50 Q76 47.5 66 50 Z" />
              </g>
            )}

            {/* Nervous — outline ring */}
            {isNervous && (
              <g fill="none" stroke={NERVOUS_MINT} strokeWidth={0.9} opacity={0.5}>
                <ellipse cx={44} cy={50} rx={10.5} ry={9.5} />
                <ellipse cx={76} cy={50} rx={10.5} ry={9.5} />
              </g>
            )}
          </g>

          {/* Glasses — thick frames */}
          <g className="piku-glasses" pointerEvents="none">
            {/* Left lens */}
            <rect x={33} y={41} width={22} height={19} rx={5} fill="rgba(255,255,255,0.1)" stroke={GLASS} strokeWidth={1.8} />
            {/* Right lens */}
            <rect x={65} y={41} width={22} height={19} rx={5} fill="rgba(255,255,255,0.1)" stroke={GLASS} strokeWidth={1.8} />
            {/* Bridge */}
            <path d="M55 50 Q60 47 65 50" fill="none" stroke={GLASS} strokeWidth={1.7} strokeLinecap="round" />
            {/* Left temple */}
            <path d="M33 50 L24 50" stroke={GLASS} strokeWidth={1.4} strokeLinecap="round" />
            {/* Right temple */}
            <path d="M87 50 L96 50" stroke={GLASS} strokeWidth={1.4} strokeLinecap="round" />
          </g>

          {/* Beak — simple triangle */}
          <g className="piku-beak" transform="translate(60,55)">
            <path d="M-6 -3 L6 -3 L0 5 Z" fill={BEAK} />
            <path d="M-4 0.5 L4 0.5 L0 4.5 Z" fill="#E67E22" opacity={0.7} />
          </g>

          {/* Blush for happy/proud/excited */}
          {(isHappy || isProud || isExcited) && (
            <g opacity={isExcited ? 0.6 : 0.5}>
              <ellipse cx={30} cy={59} rx={5} ry={3.5} fill={BLUSH} />
              <ellipse cx={90} cy={59} rx={5} ry={3.5} fill={BLUSH} />
            </g>
          )}

          {/* Sweat for nervous/surprised */}
          {(isNervous || isSurprised) && (
            <g className="piku-sweat" transform="translate(88,31)">
              <path d="M0 0 C2.5 3 2 7 0 10 C-2 7 -2.5 3 0 0 Z" fill="#9EC3D8" />
            </g>
          )}

          {/* Thinking dots */}
          {isThinking && (
            <g className="piku-think-dots" fill={INK}>
              <circle cx={93} cy={31} r={1.9} opacity={0.58} />
              <circle cx={98} cy={24.5} r={2.4} opacity={0.48} />
              <circle cx={101.5} cy={17.5} r={2.9} opacity={0.38} />
            </g>
          )}

          {/* Proud sparkles */}
          {isProud && (
            <g className="piku-proud-sparkle" fill={TIE} opacity={0.72}>
              <path d="M42 44 l0.7 -2.4 0.7 2.4 2.4 0.7 -2.4 0.8 -0.7 2.5 -0.7 -2.5 -2.4 -0.8 Z" />
              <path d="M74 44 l0.7 -2.4 0.7 2.4 2.4 0.7 -2.4 0.8 -0.7 2.5 -0.7 -2.5 -2.4 -0.8 Z" />
            </g>
          )}
        </DepthLayer>

        {/* Layer: wings, feet, tie details */}
        <DepthLayer z={2}>
          {/* Wings */}
          <g className="piku-wing-front">
            <g className="piku-wing-left" style={{ transformOrigin: "28px 66px" } as React.CSSProperties}>
              <ellipse cx={28} cy={78} rx={7} ry={18} fill={INK} transform="rotate(12 28 66)" />
            </g>
            <g className="piku-wing-right" style={{ transformOrigin: "92px 66px" } as React.CSSProperties}>
              <ellipse cx={92} cy={78} rx={7} ry={18} fill={INK} transform="rotate(-12 92 66)" />
            </g>
          </g>

          {/* Feet */}
          <g className="piku-feet">
            {/* Left foot */}
            <g className="piku-foot piku-foot-left">
              <ellipse cx={48} cy={118} rx={9} ry={3.5} fill={FOOT} />
            </g>
            {/* Right foot */}
            <g className="piku-foot piku-foot-right">
              <ellipse cx={72} cy={118} rx={9} ry={3.5} fill={FOOT} />
            </g>
            {/* Dust puffs */}
            <g className="piku-dust">
              <ellipse cx={48} cy={120} rx={6} ry={1} fill="#CBD5E1" opacity={0} className="piku-dust-puff piku-dust-left" />
              <ellipse cx={72} cy={120} rx={6} ry={1} fill="#CBD5E1" opacity={0} className="piku-dust-puff piku-dust-right" />
            </g>
          </g>

          {/* Excited sparkles */}
          {isExcited && (
            <g className="piku-sparkles">
              <circle cx={20} cy={35} r={1.9} fill={EXCITED_STAR} opacity={0.86} />
              <circle cx={100} cy={40} r={1.5} fill={EXCITED_STAR} opacity={0.74} />
              <circle cx={15} cy={80} r={1.4} fill={EXCITED_STAR} opacity={0.6} />
              <circle cx={105} cy={75} r={1.9} fill={EXCITED_STAR} opacity={0.72} />
            </g>
          )}

          {/* Sleepy Zzz */}
          {isSleepy && (
            <g className="piku-zzz" fill={INK} fontFamily="inherit" fontWeight={700}>
              <text x={95} y={26} fontSize={11.5}>z</text>
              <text x={102.5} y={17} fontSize={8.5}>z</text>
              <text x={107.5} y={10} fontSize={6.8}>z</text>
            </g>
          )}

          {/* Peeking hat */}
          {isPeeking && (
            <g className="piku-peek-hat" transform="translate(40,7.5)">
              <rect x={0} y={0} width={40} height={8} rx={4} fill="#2E3440" />
              <rect x={-5} y={6} width={50} height={3} rx={1.5} fill="#252A34" />
            </g>
          )}
        </DepthLayer>
      </svg>
      <div className="piku-ground-shadow" aria-hidden="true" />
      <div className="piku-ground-shadow-soft" aria-hidden="true" />
    </>
  );
}
