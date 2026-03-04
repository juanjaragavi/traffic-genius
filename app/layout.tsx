import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Providers from "@/components/Providers";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TrafficGenius — Anti-Bot Security Dashboard | TopNetworks",
  description:
    "Centralized security analytics, IVT detection, and Cloud Armor rule management. Powered by TopNetworks, Inc.",
  icons: {
    icon: "https://storage.googleapis.com/media-topfinanzas-com/favicon.png",
    apple: "https://storage.googleapis.com/media-topfinanzas-com/favicon.png",
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
      </body>
    </html>
  );
}
