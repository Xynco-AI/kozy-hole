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
import { supabaseAnon } from "@/lib/supabase";

export const revalidate = 300;

export default async function Home() {
  let reviews: { guest_name: string; rating: number; comment: string }[] = [];
  try {
    const { data } = await supabaseAnon
      .from("reviews")
      .select("guest_name,rating,comment")
      .eq("approved", true)
      .order("created_at", { ascending: false })
      .limit(12);
    reviews = data ?? [];
  } catch {
    reviews = [];
  }

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
        <Reviews reviews={reviews} />
        <About />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
