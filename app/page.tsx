import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Hero from "@/components/sections/Hero";
import Cabins from "@/components/sections/Cabins";
import Amenities from "@/components/sections/Amenities";
import Rates from "@/components/sections/Rates";
import HowItWorks from "@/components/sections/HowItWorks";
import WhatToBring from "@/components/sections/WhatToBring";
import Reviews from "@/components/sections/Reviews";
import About from "@/components/sections/About";
import Contact from "@/components/sections/Contact";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <Hero />
        <Cabins />
        <Amenities />
        <Rates />
        <HowItWorks />
        <WhatToBring />
        <Reviews />
        <About />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
