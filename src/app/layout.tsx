import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lounge | Premium Airport Lounges",
  description: "Unlock access to the world's most exclusive airport lounges. Relax, dine, and refresh before your next flight.",
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
    title: "Lounge | Premium Airport Lounges",
    description: "Unlock access to the world's most exclusive airport lounges. Relax, dine, and refresh before your next flight.",
    url: "https://lounge.com",
    siteName: "Lounge",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lounge | Premium Airport Lounges",
    description: "Unlock access to the world's most exclusive airport lounges. Relax, dine, and refresh before your next flight.",
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
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
