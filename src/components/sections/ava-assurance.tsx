import { ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { assurance } from "@/lib/data";
import { getIcon } from "@/lib/icons";
import { STAGGER } from "@/lib/motion";

export function AvaAssurance() {
  return (
    <Section
      id="assurance"
      labelledBy="assurance-heading"
      tone="navy"
      className="overflow-hidden"
    >
      {/* Quiet concentric detail */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -right-40 -top-56 size-[560px] rounded-full border border-white/[0.06]" />
        <div className="absolute -bottom-72 -left-40 size-[620px] rounded-full border border-white/[0.05]" />
      </div>

      <div className="relative mx-auto max-w-2xl text-center">
        <Reveal>
          {/* Official guarantee badge — the accent's key moment on the page. */}
          <p className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-2">
            <ShieldCheck aria-hidden="true" className="size-4 text-accent" />
            <span className="text-caption uppercase tracking-[0.14em] text-accent">
              {assurance.badgeTitle}
            </span>
          </p>
        </Reveal>
        <Reveal delay={0.08}>
          <h2 id="assurance-heading" className="text-h2 mt-6 font-sans text-white">
            {assurance.title}
          </h2>
        </Reveal>
        <Reveal delay={0.16}>
          <p className="text-body-lg mx-auto mt-4 max-w-xl text-white/70">
            {assurance.lede}
          </p>
        </Reveal>
      </div>

      {/*
        Lifecycle reads as one connected run rather than four separate tiles —
        a hairline rule threads the stages on desktop and turns vertical on
        smaller screens where a horizontal flow would break down.
      */}
      <ol className="relative mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        <div
          aria-hidden="true"
          className="absolute left-0 right-0 top-6 hidden h-px bg-white/15 lg:block"
        />
        {assurance.stages.map((stage, index) => {
          const Icon = getIcon(stage.icon);
          return (
            <Reveal key={stage.title} delay={index * STAGGER} className="h-full">
              <li className="relative h-full lg:pr-6">
                <div className="flex items-center gap-3">
                  <span className="relative z-10 inline-flex size-12 shrink-0 items-center justify-center rounded-full border border-white/15 bg-primary">
                    <Icon
                      aria-hidden="true"
                      strokeWidth={1.5}
                      className="size-5 text-accent"
                    />
                  </span>
                  <span className="font-sans text-sm font-semibold tabular-nums text-white/30">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="text-h6 mt-5 font-sans text-white">{stage.title}</h3>
                <p className="text-small mt-2 leading-relaxed text-white/65">
                  {stage.body}
                </p>
              </li>
            </Reveal>
          );
        })}
      </ol>

      <Reveal delay={0.3}>
        <p className="text-small relative mx-auto mt-14 max-w-xl text-center text-white/60">
          {assurance.badgeBody} — if a gift arrives broken, late or not as pictured, we
          replace it. No forms, no follow-ups.
        </p>
      </Reveal>
    </Section>
  );
}
