"use client";

import { Gift, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { helpChoosing } from "@/lib/data";
import { usePikuConcierge } from "./piku-concierge-context";

/**
 * "Need Help Choosing?" — guided assistance for undecided visitors.
 * All three actions open the Piku concierge; which step they land on comes
 * from `helpChoosing` in data.ts so the copy and the destination stay together.
 */
export function NeedHelpChoosing() {
  const { openConcierge } = usePikuConcierge();

  return (
    <Section id="help" labelledBy="help-heading" tone="surface">
      <Reveal>
        <div className="rounded-2xl border border-divider bg-white px-6 py-10 shadow-card sm:px-10 sm:py-12 lg:px-14">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
            {/* Left — pitch + actions */}
            <div>
              <h2 id="help-heading" className="text-h3 font-sans text-text-primary">
                {helpChoosing.title}
              </h2>
              <p className="text-body mt-4 max-w-md text-text-secondary">
                {helpChoosing.body}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  variant="gradient"
                  size="lg"
                  onClick={() => openConcierge(helpChoosing.primaryStep)}
                >
                  <MessageCircle aria-hidden="true" className="size-4" />
                  {helpChoosing.primaryCta}
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => openConcierge(helpChoosing.secondaryStep)}
                >
                  <Gift aria-hidden="true" className="size-4" />
                  {helpChoosing.secondaryCta}
                </Button>
              </div>
            </div>

            {/* Right — brief card */}
            <div className="rounded-xl bg-surface p-6 sm:p-8">
              <h3 className="text-h6 font-sans text-text-primary">
                {helpChoosing.briefCardTitle}
              </h3>
              <p className="text-small mt-2 leading-relaxed text-text-secondary">
                {helpChoosing.briefCardBody}
              </p>
              <Button
                variant="primary"
                onClick={() => openConcierge(helpChoosing.briefCardStep)}
                className="mt-6 w-full"
              >
                {helpChoosing.briefCardCta}
              </Button>
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
