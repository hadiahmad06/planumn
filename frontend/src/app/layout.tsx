import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from "./client-layout";


import '@mantine/carousel/styles.css';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from '@mantine/core';
import { Notifications } from "@mantine/notifications";
import { UserSessionProvider } from "@/contexts/data/UserSessionProvider";
import { PlanProvider } from "@/contexts/data/PlanProvider";
import { DisplaySettingsProvider } from "@/contexts/visual/DisplaySettingsProvider";
import { MobileProvider } from "@/contexts/visual/MobileProvider";
import { PlanAuditProvider } from "@/contexts/data/PlanAuditProvider";
import { theme } from "@/styles/theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PlanUMN - Course Planning Made Easy",
  description: "PlanUMN is a powerful course and graduation planning tool built for University of Minnesota students. Easily visualize, organize, and schedule your academic path with our drag-and-drop interface.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
        <link rel="icon" href="/favicon.ico" />

        {/* Open Graph / Social Preview */}
        <meta property="og:title" content="PlanUMN - UMN Grad Planner" />
        <meta property="og:description" content="PlanUMN is a powerful course and graduation planning tool built for University of Minnesota students. Easily visualize, organize, and schedule your academic path with our drag-and-drop interface." />
        <meta property="og:image" content="https://planu.mn/og-image.png" />
        <meta property="og:url" content="https://planu.mn" />
        <meta name="twitter:card" content="summary_large_image" />

        {/* SEO Meta */}
        <meta name="description" content="PlanUMN is a powerful course and graduation planning tool built for University of Minnesota students. Easily visualize, organize, and schedule your academic path with our drag-and-drop interface." />
        <meta name="keywords" content="PlanUMN, UMN, University of Minnesota, Twin Cities, graduation planner, class schedule, academic planner, course planning, UMN class search, GopherGrades, UMN Schedule Builder, college course management" />
        <meta name="author" content="Hadi Ahmad, Michael Zewdie" />
      </head>
      <body>
        <MantineProvider theme={theme}>
          <Notifications autoClose={4000}/>
          <MobileProvider>
            <UserSessionProvider>
              <PlanProvider>
                <PlanAuditProvider>
                  <DisplaySettingsProvider>
                    <ClientLayout>
                      {children}
                    </ClientLayout>
                  </DisplaySettingsProvider>
                </PlanAuditProvider>
              </PlanProvider>
            </UserSessionProvider>
          </MobileProvider>
          {/* {children} */}
        </MantineProvider>
      </body>
    </html>
  );
}
