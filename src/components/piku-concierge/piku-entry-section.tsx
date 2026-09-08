"use client";

import { Gift, MessageCircle } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { helpChoosing } from "@/lib/data";
import { usePikuConcierge } from "./piku-concierge-context";

/**
 * "Need Help Choosing?" — guided assistance for undecided visitors.
 * Both actions open the Piku concierge flow; "Send a Gifting Brief"
 * deep-links straight to the details step.
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
                <button
                  type="button"
                  onClick={() => openConcierge()}
                  className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-primary px-7 text-button text-white transition-opacity duration-200 hover:opacity-90 active:translate-y-px motion-reduce:transition-none"
                >
                  <MessageCircle aria-hidden="true" className="size-4" />
                  {helpChoosing.primaryCta}
                </button>
                <button
                  type="button"
                  onClick={() => openConcierge()}
                  className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white px-7 text-button text-text-primary transition-colors duration-200 hover:border-neutral-400 hover:bg-hover-surface active:translate-y-px motion-reduce:transition-none"
                >
                  <Gift aria-hidden="true" className="size-4" />
                  {helpChoosing.secondaryCta}
                </button>
              </div>
            </div>

            {/* Right — brief card */}
            <div className="rounded-xl bg-surface p-6 sm:p-8">
              <h3 className="text-h6 font-sans text-text-primary">Send a Gifting Brief</h3>
              <p className="text-small mt-2 leading-relaxed text-text-secondary">
                Know exactly what you need? Skip the chat and send your requirements
                straight to our gifting team.
              </p>
              <button
                type="button"
                onClick={() => openConcierge("contact")}
                className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-full bg-interactive px-7 text-sm font-semibold text-white transition-colors duration-200 hover:bg-interactive-hover active:bg-interactive-active active:translate-y-px motion-reduce:transition-none"
              >
                Submit Brief
              </button>
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
