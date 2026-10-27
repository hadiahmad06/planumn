import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteAnalytics } from "@/features/marketing/SiteAnalytics";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "planu.mn",
  description:
    "Plan your University of Minnesota degree, semester by semester.",
  metadataBase: new URL("https://planu.mn"),
  icons: { icon: "/brand/favicon.ico" },
  openGraph: {
    title: "planu.mn — Your degree. A plan you can see.",
    description:
      "Plan your University of Minnesota courses, semester by semester.",
    images: [
      {
        url: "/brand/social.png",
        width: 1200,
        height: 630,
        alt: "planu.mn — Your degree. A plan you can see.",
      },
    ],
  },
  twitter: { card: "summary_large_image", images: ["/brand/social.png"] },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {children}
        <SiteAnalytics />
      </body>
    </html>
  );
}
