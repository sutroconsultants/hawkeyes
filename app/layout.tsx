"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TamboProviderWrapper } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TamboProviderWrapper>{children}</TamboProviderWrapper>
      </body>
    </html>
  );
}
