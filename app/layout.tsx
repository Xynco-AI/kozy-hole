import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import ScrollProgress from "@/components/ScrollProgress";
import ScrollReveal from "@/components/ScrollReveal";

// Display serif — characterful, high optical size for headings & accents.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700", "900"],
  display: "swap",
});

// Body / UI grotesque.
const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Kozy Hole Ice Shack Rentals",
    template: "%s · Kozy Hole Ice Shack Rentals",
  },
  description:
    "Heated, fully-loaded ice fishing shacks on Lac la Biche, Alberta. Sleeps up to 5, satellite TV, forward-facing sonar, pre-drilled holes. Clean, reliable, locally owned.",
  keywords: [
    "ice shack rental",
    "ice fishing",
    "Lac la Biche",
    "Alberta",
    "heated ice shack",
    "ice fishing rental",
  ],
  authors: [{ name: "Kozy Hole Ice Shack Rentals" }],
  openGraph: {
    title: "Kozy Hole Ice Shack Rentals",
    description:
      "Heated, fully-loaded ice fishing shacks on Lac la Biche, Alberta. Sleeps up to 5. Book your day on the ice.",
    url: SITE_URL,
    siteName: "Kozy Hole Ice Shack Rentals",
    locale: "en_CA",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Kozy Hole Ice Shack Rentals" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kozy Hole Ice Shack Rentals",
    description:
      "Heated, fully-loaded ice fishing shacks on Lac la Biche, Alberta. Sleeps up to 5.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${hanken.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
          <ScrollProgress />
          <ScrollReveal />
          {children}
        </body>
    </html>
  );
}
