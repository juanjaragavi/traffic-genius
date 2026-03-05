import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Providers from "@/components/Providers";
import { Toaster } from "sonner";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const SITE_URL = "https://trafficgenius.topnetworks.co";
const OG_IMAGE = "/images/og-image.webp";

export const metadata: Metadata = {
  title: {
    default: "TrafficGenius — Anti-Bot Security Dashboard | TopNetworks",
    template: "%s | TrafficGenius",
  },
  description:
    "Centralized security analytics, IVT detection, and Google Cloud Armor rule management for TopNetworks properties.",
  metadataBase: new URL(SITE_URL),
  applicationName: "TrafficGenius",
  authors: [{ name: "TopNetworks, Inc.", url: "https://topnetworks.co" }],
  creator: "TopNetworks, Inc.",
  publisher: "TopNetworks, Inc.",
  keywords: [
    "anti-bot",
    "IVT detection",
    "invalid traffic",
    "Cloud Armor",
    "security dashboard",
    "traffic analytics",
    "TopNetworks",
  ],
  icons: {
    icon: "https://storage.googleapis.com/media-topfinanzas-com/favicon.png",
    apple: "https://storage.googleapis.com/media-topfinanzas-com/favicon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: "es_CO",
    url: SITE_URL,
    siteName: "TrafficGenius",
    title: "TrafficGenius — Anti-Bot Security Dashboard",
    description:
      "Centralized security analytics, IVT detection, and Google Cloud Armor rule management for TopNetworks properties.",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "TrafficGenius — Security Dashboard by TopNetworks",
        type: "image/webp",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TrafficGenius — Anti-Bot Security Dashboard",
    description:
      "Centralized security analytics, IVT detection, and Cloud Armor rule management.",
    images: [OG_IMAGE],
    creator: "@topnetworks",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
