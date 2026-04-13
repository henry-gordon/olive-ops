import type { Metadata } from "next";
import Link from "next/link";
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
  title: "Olive Ops",
  description: "Household operations for Olive.",
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
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-40 border-b border-gray-200 bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/85 dark:border-zinc-800">
          <nav
            aria-label="Primary navigation"
            className="mx-auto flex max-w-md items-center justify-between gap-3"
          >
            <Link href="/" className="text-sm font-semibold">
              Olive Ops
            </Link>
            <Link
              href="/"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium dark:border-zinc-700"
            >
              Today
            </Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
