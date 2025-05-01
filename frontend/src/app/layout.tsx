import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
  title: "Planumn - Course Planning Made Easy",
  description: "Plan your academic journey with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-background`}>
        <header className="bg-white border-b border-border shadow-sm">
          <nav className="container py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="text-2xl font-bold text-primary">
                Planumn
              </Link>
              <div className="flex gap-6">
                <Link href="/plan" className="text-foreground hover:text-primary transition-colors">
                  Plan
                </Link>
                <Link href="/courses" className="text-foreground hover:text-primary transition-colors">
                  Courses
                </Link>
                <Link href="/about" className="text-foreground hover:text-primary transition-colors">
                  About
                </Link>
              </div>
            </div>
          </nav>
        </header>

        <main className="flex-grow container py-8">
          {children}
        </main>

        <footer className="bg-white border-t border-border py-8">
          <div className="container">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-sm text-secondary">
                © {new Date().getFullYear()} Planumn. All rights reserved.
              </div>
              <div className="flex gap-4">
                <Link href="/privacy" className="text-sm text-secondary hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="text-sm text-secondary hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
