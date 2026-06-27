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
  | "washroom";

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
  logo: "/brand/logo.jpg",
} as const;

export const contact = {
  email: "kozyhole@gmail.com",
  owners: [
    { name: "Rob", phone: "780-910-7902" },
    { name: "Jason", phone: "780-719-6540" },
  ],
  petPolicy:
    "Pet-friendly — $50 per stay. Please clean up after your pet and keep them supervised inside the shack.",
} as const;

export const nav: NavLink[] = [
  { label: "Cabins", href: "#cabins" },
  { label: "Amenities", href: "#amenities" },
  { label: "Rates", href: "#rates" },
  { label: "How it works", href: "#location" },
  { label: "Reviews", href: "#reviews" },
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
  body: "Every shack is the same calibre of warm, clean, and ready-to-fish — the layouts just differ a little. Pick the one that fits your crew.",
  // Owner hasn't finalized names yet.
  namesNote: "Cabin names coming soon — the owner is still deciding.",
};

export const cabins: Cabin[] = [
  {
    slug: "cabin-one",
    name: "Cabin One",
    sleeps: "Sleeps 4 (5 with cot)",
    photo: "/brand/shack-exterior-1.png",
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
    photo: "/brand/cabin-interior-1.png",
    photoAlt:
      "Warm wood-lined ice shack interior with bunk beds on both sides and a wall-mounted TV.",
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
      "Wood-lined ice shack interior with a dining table, chairs, wall TV and a tool chest.",
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
    title: "Holes, ready to fish",
    icon: "auger",
    items: [
      "6–8 pre-drilled holes (included)",
      "Sleeves & safety covers on every hole",
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
  "Good to know: bring your own bedding and coolers — there is no fridge on board.";

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
    value: "Card adds 3%; e-transfer is free.",
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
    body: "Lock it in with a 50% deposit by card (+3%) or e-transfer (no fee).",
  },
  {
    title: "Meet us at the lake",
    body: "We meet you on Lac la Biche and get you settled into your warm, ready shack.",
  },
];

export const location = {
  eyebrow: "Where we are",
  title: "On the ice at Lac la Biche",
  body: "We're out on Lac la Biche Lake, near the town of Lac la Biche, Alberta. We meet you at the lake — and your exact shack location is confirmed closer to your stay, based on ice conditions, so you're always set up on safe, good ice.",
  seasonLabel: "Season",
  season: "December 15 – March 31",
  photo: "/brand/shack-exterior-2.png",
  photoAlt:
    "A dark modern ice shack lit up on the lake, open front showing bunks and a dining area under a bright sky.",
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
  body: "We're brand new on the ice, so there are no reviews yet — reviews coming soon. Stay with us this season and tell the next crew what you thought.",
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
    "Our mission is simple: clean, well-maintained, reliable ice shacks backed by friendly, dependable service. Some of the best memories are made on the frozen lake — whether you're chasing your next big catch, introducing someone to ice fishing for the first time, or just enjoying time with the people who matter most.",
    "As a locally owned and operated business, we help you spend less time worrying about the details and more time enjoying your day on the ice.",
  ],
} as const;

// ----------------------------------------------------------------------------

export const contactIntro = {
  eyebrow: "Get in touch",
  title: "Questions? Reach out anytime",
  body: "Call or text either of us, or send an email — we're happy to help you plan your trip.",
};

export const footer = {
  seasonNote: `Open season ${business.season}. We fish Lac la Biche, Alberta.`,
  rightsLine: `© ${new Date().getFullYear()} ${business.name}. All rights reserved.`,
} as const;
