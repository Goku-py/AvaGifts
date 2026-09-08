import { getClientLogo } from "@/components/ui/client-logos";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { trusted } from "@/lib/data";
import { STAGGER } from "@/lib/motion";

export function TrustedCustomers() {
  return (
    <Section
      id="trusted"
      labelledBy="trusted-heading"
      tone="surface"
      density="compact"
    >
      {/* Asymmetric: the claim sits left, the proof runs right. Deliberately
          not another centred eyebrow/title/lede stack. */}
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center lg:gap-16">
        <div>
          <Reveal>
            <Eyebrow>{trusted.eyebrow}</Eyebrow>
          </Reveal>
          <Reveal delay={0.08}>
            <h2
              id="trusted-heading"
              className="text-h3 mt-4 font-sans text-text-primary"
            >
              {trusted.title}
            </h2>
          </Reveal>
          <Reveal delay={0.14}>
            <p className="text-body mt-4 max-w-md text-text-secondary">
              {trusted.lede}
            </p>
          </Reveal>
        </div>

        <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-divider bg-divider sm:grid-cols-4">
          {trusted.customers.map((customer, index) => {
            const Mark = getClientLogo(customer.logo);
            return (
              <Reveal
                key={customer.name}
                delay={index * STAGGER}
                className="h-full"
              >
                <li className="group flex h-full flex-col justify-between gap-6 bg-white p-5 sm:p-6">
                  {/* Marks sit in the muted ink a real logo wall uses, and come
                      up to brand blue on hover so the row still feels alive. */}
                  <Mark className="size-8 text-text-muted transition-colors duration-300 ease-out group-hover:text-interactive motion-reduce:transition-none" />
                  <div>
                    <p className="font-sans text-sm font-semibold leading-snug text-text-primary">
                      {customer.name}
                    </p>
                    <p className="text-caption mt-1 text-text-muted">
                      {customer.sector}
                    </p>
                    <p className="text-caption mt-3 text-interactive">
                      Since {customer.since}
                    </p>
                  </div>
                </li>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </Section>
  );
}
