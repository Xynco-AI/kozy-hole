import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Hero from "@/components/sections/Hero";
import Cabins from "@/components/sections/Cabins";
import Amenities from "@/components/sections/Amenities";
import Rates from "@/components/sections/Rates";
import HowItWorks from "@/components/sections/HowItWorks";
import WhatToBring from "@/components/sections/WhatToBring";
import FAQ from "@/components/sections/FAQ";
import About from "@/components/sections/About";
import Contact from "@/components/sections/Contact";
import { supabaseAnon } from "@/lib/supabase";

export const revalidate = 300;

export default async function Home() {
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
        <FAQ />
        <About />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
