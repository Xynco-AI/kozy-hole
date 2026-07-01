/**
 * Kozy Hole Ice Shack Rentals — marketing content.
 *
 * Single source of truth for the landing page (and reused by later pages).
 * No live DB needed to render any of this. All fields are typed so the UI
 * stays in sync with the copy.
 *
 * NOTE: Cabin names are NOT finalized by the owner yet — these are
 * placeholders ("Cabin One/Two/Three"). Do not present them as final.
 */

export type NavLink = { label: string; href: string };

export type CabinFeature = string;

export type Cabin = {
  /** Stable slug, safe to use in URLs / keys even before names are final. */
  slug: string;
  /** Placeholder name — TBD by owner. */
  name: string;
  /** Capacity summary shown on the card. */
  sleeps: string;
  /** Real photo from /public/brand. */
  photo: string;
  /** Alt text for the photo. */
  photoAlt: string;
  /** 3–4 key, card-level features. */
  features: CabinFeature[];
};

export type AmenityGroup = {
  title: string;
  /** Icon key resolved by the Amenities section to an inline SVG. */
  icon: AmenityIcon;
  items: string[];
};

export type AmenityIcon =
  | "flame"
  | "solar"
  | "auger"
  | "tv"
  | "stove"
  | "supplies"
  | "shield"
  | "washroom"
  | "fish";

export type Step = { title: string; body: string };

export type Rate = { label: string; price: string; note?: string };

// ----------------------------------------------------------------------------

export const business = {
  name: "Kozy Hole Ice Shack Rentals",
  shortName: "Kozy Hole",
  tagline: "Heated ice shacks on Lac la Biche",
  location: "Lac la Biche Lake, Alberta",
  town: "Lac la Biche",
  season: "December 15 – March 31",
  logo: "/brand/logo.png",
} as const;

export const contact = {
  email: "kozyhole@gmail.com",
  owners: [
    { name: "Rob", phone: "780-910-7902" },
    { name: "Jason", phone: "780-719-6540" },
  ],
  petPolicy:
    "Pet-friendly ($50 per stay). Please clean up after your pet and keep them supervised inside the shack.",
} as const;

export const nav: NavLink[] = [
  { label: "Cabins", href: "#cabins" },
  { label: "Amenities", href: "#amenities" },
  { label: "Rates", href: "#rates" },
  { label: "How it works", href: "#location" },
  { label: "FAQ", href: "#faq" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

// ----------------------------------------------------------------------------

export const hero = {
  eyebrow: "Lac la Biche, Alberta · Dec 15 – Mar 31",
  // Split for typographic emphasis (the middle line is set in italic ice-blue).
  headline: {
    pre: "Your warm spot",
    accent: "on the hard water",
    post: "",
  },
  subhead:
    "Heated, fully-loaded ice fishing shacks that sleep up to 5. Memory-foam bunks, satellite TV with forward-facing sonar, holes pre-drilled and ready. You just bring the cooler and the bragging rights.",
  primaryCta: { label: "Book a cabin", href: "/book" },
  secondaryCta: { label: "Explore the cabins", href: "#cabins" },
  // Quick trust strip under the CTAs.
  highlights: [
    "Heated & insulated",
    "Sleeps up to 5",
    "Satellite TV + sonar",
    "On Lac la Biche",
  ],
} as const;

// ----------------------------------------------------------------------------

export const cabinsIntro = {
  eyebrow: "The shacks",
  title: "Three cabins, one very comfortable day on the ice",
  body: "Every shack is the same calibre of warm, clean, and ready-to-fish. The layouts just differ a little. Pick the one that fits your crew.",
  // Owner hasn't finalized names yet.
  namesNote: "Cabin names coming soon.",
};

export const cabins: Cabin[] = [
  {
    slug: "cabin-one",
    name: "Cabin One",
    sleeps: "Sleeps 4 (5 with cot)",
    photo: "/brand/cabin-1.png",
    photoAlt:
      "Modern dark ice shack with an open front showing bunk beds and a dining table, under a blue sky.",
    features: [
      "2 bunk beds with 5″ memory-foam mattresses",
      "Flip-up dining table + 5 chairs",
      "Smart TV with satellite + sonar hookup",
      "Sleeps 4 comfortably, 5 with a cot",
    ],
  },
  {
    slug: "cabin-two",
    name: "Cabin Two",
    sleeps: "Sleeps 4 (5 with cot)",
    photo: "/brand/cabin-2.png",
    photoAlt:
      "Ice shack interior with bunk beds, wood-panelled walls and recessed lighting.",
    features: [
      "2 bunk beds with 5″ memory-foam mattresses",
      "Flip-up dining table + 5 chairs",
      "Smart TV with satellite + sonar hookup",
      "Bright wood interior, bunks both sides",
    ],
  },
  {
    slug: "cabin-three",
    name: "Cabin Three",
    sleeps: "Sleeps 4 (5 with cot)",
    photo: "/brand/cabin-interior-2.png",
    photoAlt:
      "Ice shack interior with light wood ceiling, industrial storage cabinet, dining table and chairs.",
    features: [
      "Single bunks + 2 futons, 5″ memory-foam",
      "Flip-up dining table + 5 chairs",
      "Smart TV with satellite + sonar hookup",
      "A roomier, lounge-style layout",
    ],
  },
];

// ----------------------------------------------------------------------------

export const amenitiesIntro = {
  eyebrow: "Fully loaded",
  title: "Everything you need is already inside",
  body: "Each shack arrives stocked and ready. Show up, get warm, drop a line.",
};

export const amenities: AmenityGroup[] = [
  {
    title: "Serious heat",
    icon: "flame",
    items: [
      "Direct-vent propane furnace",
      "Diesel backup heater",
      "All propane supplied for heat & cooking",
    ],
  },
  {
    title: "Off-grid power",
    icon: "solar",
    items: ["Full solar setup with inverter", "Inverter generator on board"],
  },
  {
    title: "Pre-drilled holes, ready to fish",
    icon: "auger",
    items: [
      "6–8 pre-drilled holes (included)",
      "Sleeves & safety covers on every hole",
    ],
  },
  {
    title: "Fishing gear included",
    icon: "fish",
    items: [
      "Fishing rods & tackle included",
      "Underwater fish camera",
    ],
  },
  {
    title: "Entertainment & electronics",
    icon: "tv",
    items: [
      "Smart TV with satellite internet",
      "Streaming + forward-facing sonar feed",
    ],
  },
  {
    title: "Cook & eat",
    icon: "stove",
    items: [
      "Coleman stove + BBQ",
      "Pots, pans, utensils, plates & cups",
      "Coffee pot & kettle",
    ],
  },
  {
    title: "Clean & tidy",
    icon: "supplies",
    items: [
      "Paper towel, wash bin, soap",
      "Garbage bags supplied",
      "Shared heated 4×6 washroom for the 3 units",
    ],
  },
  {
    title: "Safety first",
    icon: "shield",
    items: ["Fire extinguisher", "Smoke & CO alarms"],
  },
];

// One honest heads-up so guests aren't surprised.
export const amenitiesFootnote =
  "Good to know: bring your own bedding and coolers. There is no fridge on board.";

// ----------------------------------------------------------------------------

export const ratesIntro = {
  eyebrow: "Rates & policies",
  title: "Straightforward pricing, no surprises",
  body: "Per cabin, per night. Prices are in CAD.",
};

export const rates: Rate[] = [
  { label: "Weekday night", price: "$350", note: "Sun – Thu" },
  {
    label: "Weekend & holiday night",
    price: "$450",
    note: "Fri, Sat & holidays · 2-night minimum on weekends",
  },
];

export const policies: { label: string; value: string }[] = [
  {
    label: "To book",
    value: "50% deposit reserves your cabin.",
  },
  {
    label: "Paying the deposit",
    value: "Card adds 3%; no additional fee for e-transfer.",
  },
  {
    label: "On arrival",
    value:
      "Remaining balance, a $500 damage deposit per cabin, and a $50/stay pet fee if applicable.",
  },
  {
    label: "Check-in / check-out",
    value: "Check in at 1:00 PM, check out by 11:00 AM.",
  },
  {
    label: "Weekend minimum",
    value: "2-night minimum any stay that includes a Friday or Saturday.",
  },
  {
    label: "Cancellation",
    value:
      "1 week notice earns a credit toward a future rental. No refunds, and no-shows are non-refundable.",
  },
];

// ----------------------------------------------------------------------------

export const howItWorksIntro = {
  eyebrow: "How booking works",
  title: "From request to reel-in, in four steps",
};

export const steps: Step[] = [
  {
    title: "Send a request",
    body: "Pick your cabin and dates and send us a booking request. No payment yet.",
  },
  {
    title: "We approve it",
    body: "We confirm availability for your dates and approve your request, usually quickly.",
  },
  {
    title: "Pay your 50% deposit",
    body: "Lock it in with a 50% deposit by card (+3%) or e-transfer (no additional fee).",
  },
  {
    title: "Meet us at the lake",
    body: "We meet you on Lac la Biche and get you settled into your warm, ready shack.",
  },
];

export const location = {
  eyebrow: "Where we are",
  title: "On the ice at Lac la Biche",
  body: "We're out on Lac la Biche Lake, near the town of Lac la Biche, Alberta. We meet you at the lake, and your exact shack location is confirmed closer to your stay, based on ice conditions, so you're always set up on safe, good ice.",
  seasonLabel: "Season",
  season: "December 15 – March 31",
  photo: "/brand/lac-la-biche-drone.jpg",
  photoAlt:
    "Aerial drone shot of Lac la Biche lake shoreline with forest and blue sky.",
};

// ----------------------------------------------------------------------------

export const whatToBringIntro = {
  eyebrow: "Before you go",
  title: "What to bring",
  body: "We handle the shack and the gear. You handle these four things.",
};

export const whatToBring: { title: string; detail: string }[] = [
  {
    title: "Food, water & beverages",
    detail: "There's no fridge, so pack a cooler with whatever you'll eat and drink.",
  },
  {
    title: "Bedding",
    detail: "Sheets, pillows, and blankets or sleeping bags for the bunks.",
  },
  {
    title: "Alberta fishing license",
    detail: "A valid Alberta fishing license for everyone who's fishing.",
  },
  {
    title: "Indoor shoes or slippers",
    detail: "Keep things cozy and the floors clean inside the shack.",
  },
];

// ----------------------------------------------------------------------------

export const reviewsIntro = {
  eyebrow: "Reviews",
  title: "Be the first to fish with us",
  body: "We're brand new on the ice, so there are no reviews yet. Stay with us this season and tell the next crew what you thought.",
  formTitle: "Leave a review",
  formNote: "Stayed with us? We'd love to hear how it went.",
};

// ----------------------------------------------------------------------------

export const about = {
  eyebrow: "About us",
  title: "Two friends, a frozen lake, and a lot of good days",
  // Lightly polished from the owner's copy — meaning and voice kept intact.
  paragraphs: [
    "We're two lifelong friends who turned our passion for the outdoors, great fishing, and winter adventures into a business. After years of spending our winters on the ice making unforgettable memories with family and friends, we created an ice shack rental service so others can enjoy the same experience in comfort.",
    "Our mission is simple: clean, well-maintained, reliable ice shacks backed by friendly, dependable service. Some of the best memories are made on the frozen lake, whether you're chasing your next big catch, introducing someone to ice fishing for the first time, or just enjoying time with the people who matter most.",
    "As a locally owned and operated business, we help you spend less time worrying about the details and more time enjoying your day on the ice.",
  ],
} as const;

// ----------------------------------------------------------------------------

export const contactIntro = {
  eyebrow: "Get in touch",
  title: "Questions? Reach out anytime",
  body: "Call or text either of us, or send an email. We're happy to help you plan your trip.",
};

// ----------------------------------------------------------------------------

export const faqIntro = {
  eyebrow: "FAQ",
  title: "Questions we get asked a lot",
  body: "Everything you need to know before you book.",
};

export const faqs: { q: string; a: string }[] = [
  {
    q: "How does the booking process work?",
    a: "Send a booking request with your cabin, dates, and group details — no payment yet. We confirm availability and approve your request, then you lock it in with a 50% deposit. On the day of your stay, we meet you at Lac la Biche and get you settled into your shack.",
  },
  {
    q: "How do I pay my deposit?",
    a: "By credit or debit card (a 3% processing fee applies) or by Interac e-transfer to kozyhole@gmail.com with no additional fee. Note your name and booking dates in the e-transfer message.",
  },
  {
    q: "What is due when I arrive?",
    a: "The remaining 50% balance, a $500 damage deposit per cabin, and the $50 pet fee if you are bringing a dog. The damage deposit is returned after checkout if the shack is left in good condition.",
  },
  {
    q: "What is your cancellation policy?",
    a: "Cancel with at least one week's notice and we will apply your deposit as a credit toward a future stay. Cancellations with less than one week's notice and no-shows are non-refundable.",
  },
  {
    q: "What is included in the rental?",
    a: "Everything you need to fish and stay comfortable: a heated and insulated shack, 6 to 8 pre-drilled holes with safety covers, fishing rods and tackle, an underwater fish camera, all propane for heat and cooking, full solar power, Smart TV with satellite internet and forward-facing sonar feed, Coleman stove and BBQ, pots, pans, utensils, coffee pot, paper towel, soap, garbage bags, and access to the shared heated washroom.",
  },
  {
    q: "What do I need to bring?",
    a: "Food, water, and beverages (no fridge on board, so bring a cooler), bedding for the bunks (sheets, pillows, blankets or sleeping bags), a valid Alberta fishing licence for every angler, and indoor shoes or slippers.",
  },
  {
    q: "Can I bring my dog?",
    a: "Yes. Kozy Hole is pet-friendly. There is a $50 per-stay pet fee due on arrival. Please clean up after your pet and keep them supervised inside the shack.",
  },
  {
    q: "Is there a washroom?",
    a: "Yes. There is a shared heated 4x6 washroom available to guests in all three units.",
  },
  {
    q: "Do I need a fishing licence?",
    a: "Yes. Every person who fishes needs a valid Alberta fishing licence. You can purchase one online at mywildalberta.ca before your trip.",
  },
  {
    q: "Where exactly are the shacks on the lake?",
    a: "We are out on Lac la Biche Lake, near the town of Lac la Biche. Your exact shack location is confirmed closer to your stay based on current ice conditions. We always set up on safe, productive ice.",
  },
  {
    q: "What if ice conditions are unsafe?",
    a: "Guest safety is our top priority. We monitor ice conditions throughout the season and will contact you directly if conditions require us to reschedule or relocate your stay.",
  },
  {
    q: "When is the season?",
    a: "December 15 through March 31, weather and ice permitting. We will always confirm your shack location based on ice conditions before your arrival.",
  },
];

// ----------------------------------------------------------------------------

export const footer = {
  seasonNote: `Open season ${business.season}. We fish Lac la Biche, Alberta.`,
  rightsLine: `© ${new Date().getFullYear()} ${business.name}. All rights reserved.`,
} as const;
