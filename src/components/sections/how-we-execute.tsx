import Image from "next/image";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { howWeExecute, processSteps } from "@/lib/data";
import { STAGGER } from "@/lib/motion";

export function HowWeExecute() {
  return (
    <Section
      id="how-it-works"
      labelledBy="how-heading"
      tone="ink-deep"
      className="pt-20 pb-14 sm:pt-24 sm:pb-16 lg:pt-30 lg:pb-20"
    >
      <div className="flex flex-col items-center gap-4">
        <Reveal>
          <h2
            id="how-heading"
            className="text-section-title text-center text-surface"
          >
            {howWeExecute.title}
          </h2>
        </Reveal>
        <Reveal delay={0.08}>
          {/* 18/29.7 exactly — `.text-body-lg` is 18/1.7 = 30.6, a line off. */}
          <p className="max-w-[754px] text-center text-[18px] leading-[29.7px] text-neutral-500">
            {howWeExecute.lede}
          </p>
        </Reveal>
      </div>

      <div className="relative mt-14 lg:mt-20">
        {/*
          The connector sits behind the illustrations at their mid-height and
          fades out at both ends. Hidden below lg, where the steps stack and a
          horizontal rule would cut across them.
        */}
        <div
          aria-hidden="true"
          className="absolute top-[96px] right-[178px] left-[178px] hidden h-px lg:block"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.12) 10%, rgba(255,255,255,0.12) 90%, rgba(255,255,255,0) 100%)",
          }}
        />

        <ol className="relative grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {processSteps.map((step, index) => (
            <li key={step.title}>
              <Reveal delay={(index % 4) * STAGGER}>
                <div className="flex flex-col items-center gap-5">
                  <div className="flex flex-col items-center gap-2.5">
                    <Image
                      src={step.image}
                      alt={step.imageAlt}
                      width={100}
                      height={167}
                      className="h-[167px] w-[100px] object-cover"
                    />
                    <span className="text-xs font-bold uppercase tracking-[0.96px] text-text-muted-dark">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="flex w-full flex-col items-center gap-[9px]">
                    <h3 className="text-center text-xl font-semibold leading-[26px] tracking-[-0.4px] text-white">
                      {step.title}
                    </h3>
                    <p className="text-center text-[18px] leading-[29.7px] text-neutral-500">
                      {step.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
