import { AvaAssurance } from "@/components/sections/ava-assurance";
import { FinalConversion } from "@/components/sections/final-conversion";
import { GiftingBanner } from "@/components/sections/gifting-banner";
import { GiftingJournal } from "@/components/sections/gifting-journal";
import { GiftDiscoveries } from "@/components/sections/gift-discoveries";
import { Hero } from "@/components/sections/hero";
import { HowWeExecute } from "@/components/sections/how-we-execute";
import { TrustedCustomers } from "@/components/sections/trusted";
import { WhyAvaGifts } from "@/components/sections/why-avagifts";

export default function Home() {
  return (
    <>
      <Hero />
      <TrustedCustomers />
      <GiftDiscoveries />
      <WhyAvaGifts />
      <HowWeExecute />
      <AvaAssurance />
      <GiftingBanner />
      <GiftingJournal />
      <FinalConversion />
    </>
  );
}
