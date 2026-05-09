import React from "react";
import type { Metadata } from "next";
import { Inter, Fredoka } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Snabb Web",
  description: "The fast, reliable platform for getting things done.",
};

import { ToastProvider } from "@/components/Toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${fredoka.variable} antialiased bg-background text-foreground`}
        style={{ '--font-fredoka': fredoka.style.fontFamily } as React.CSSProperties}
        suppressHydrationWarning
      >
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
