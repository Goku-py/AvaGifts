import { About } from "@/components/sections/about";
import { CatalogCta } from "@/components/sections/catalog-cta";
import { Categories } from "@/components/sections/categories";
import { Contact } from "@/components/sections/contact";
import { FeaturedProducts } from "@/components/sections/featured-products";
import { PikuEntrySection } from "@/components/piku-concierge";
import { Hero } from "@/components/sections/hero";
import { Services } from "@/components/sections/services";
import { WhyAvaGifts } from "@/components/sections/why-avagifts";

export default function Home() {
  return (
    <>
      <Hero />
      <Categories />
      <FeaturedProducts />
      <CatalogCta />
      <PikuEntrySection />
      <WhyAvaGifts />
      <Services />
      <About />
      <Contact />
    </>
  );
}
