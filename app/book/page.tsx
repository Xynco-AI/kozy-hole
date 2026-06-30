import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import BookingForm from "@/components/BookingForm";
import { supabaseAnon } from "@/lib/supabase";
import { cabins as contentCabins } from "@/lib/content";
import type { CabinOption } from "@/components/booking/CabinPicker";

export const metadata: Metadata = {
  title: "Book a Cabin",
  description:
    "Reserve your heated ice fishing shack on Lac la Biche. Pick your cabin, choose your dates, and send a booking request — we confirm availability and you pay your 50% deposit after approval.",
};

export default async function BookPage() {
  // Try to fetch real cabins from Supabase
  const { data, error } = await supabaseAnon
    .from("cabins")
    .select("id,slug,name,photos,sleeps,max_with_cot")
    .order("sort_order");

  let cabins: CabinOption[];
  let previewMode: boolean;

  if (!error && data && data.length > 0) {
    cabins = data as CabinOption[];
    previewMode = false;
  } else {
    // Fallback: derive from content.ts (slug used as stand-in id)
    cabins = contentCabins.map((c) => ({
      id: c.slug,
      slug: c.slug,
      name: c.name,
      photos: [c.photo],
      sleeps: 4,
      max_with_cot: 5,
    }));
    previewMode = true;
  }

  return (
    <>
      <SiteHeader />

      <main className="min-h-screen">
        {/* Page header */}
        <div className="border-b border-hairline bg-surface/30 py-14 sm:py-20">
          <Container>
            <SectionHeading
              eyebrow="Book a stay"
              title="Reserve your spot on the ice"
              body="Choose your cabin, pick your dates, and send us a request. No payment yet. We confirm availability first, then collect your 50% deposit."
            />
          </Container>
        </div>

        {/* Form */}
        <Container className="py-14 sm:py-20" size="narrow">
          <BookingForm cabins={cabins} previewMode={previewMode} />
        </Container>
      </main>

      <SiteFooter />
    </>
  );
}
