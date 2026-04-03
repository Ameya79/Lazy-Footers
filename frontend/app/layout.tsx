/**
 * Root layout for Lazy Footers.
 *
 * This file defines the outermost HTML structure shared by all pages:
 * - HTML lang attribute for accessibility and SEO
 * - Font loading (Geist Sans from the local font files)
 * - Global CSS import
 * - SEO metadata (title, description)
 *
 * This file does NOT contain any page-specific content or state.
 */

import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

/* -- Load Geist Sans from the bundled local font files -- */
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

/* --------------------------------------------------------------------------
 * SEO Metadata
 * -------------------------------------------------------------------------- */

export const metadata: Metadata = {
  title: "Lazy Footers — Mass Footer Changer",
  description:
    "Upload PDF or DOCX files, type a footer, and download them all as PDFs with the footer applied. Fast, free, and works on mobile.",
};

/* --------------------------------------------------------------------------
 * Layout Component
 * -------------------------------------------------------------------------- */

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased`}
        style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}
