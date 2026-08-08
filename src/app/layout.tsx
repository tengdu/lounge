import type { Metadata } from "next";
import Script from "next/script";
import { Geist } from "next/font/google";
import "./globals.css";

// Geist_Mono was loaded but never applied to anything — dropping it removes
// a font payload from every page.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lounge — Every airport lounge in the US",
  description: "Find every airport lounge in the United States — locations, amenities, and access rules.",
  keywords: [
    "airport lounge",
    "premium travel",
    "airport oasis",
    "first class lounge",
    "business class lounge",
    "airport VIP",
    "travel comfort",
    "Lounge"
  ],
  authors: [{ name: "Lounge Team" }],
  creator: "Lounge",
  publisher: "Lounge",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Lounge — Every airport lounge in the US",
    description: "Find every airport lounge in the United States — locations, amenities, and access rules.",
    url: "https://lounge.com",
    siteName: "Lounge",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lounge — Every airport lounge in the US",
    description: "Find every airport lounge in the United States — locations, amenities, and access rules.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        {children}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-303FFNJK2S"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-303FFNJK2S');
            `,
          }}
        />
      </body>
    </html>
  );
}
