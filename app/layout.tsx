"use client"
import { useEffect } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs'
import { Theme } from '@radix-ui/themes';
import ServiceBell from "@servicebell/widget";

export const dynamic = "force-dynamic";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", weight: ["400","700"] });

// Define the type for the ServiceBell function
declare function ServiceBell(action: string, apiKey: string): void;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    // Use a type assertion to tell TypeScript that ServiceBell is a function
    (ServiceBell as any)("init", "b951bf1ae1c8405b8f7a47ae2a153512");
  }, []);

  return (
    <ClerkProvider afterSignOutUrl={"https://www.happybase.co"} appearance={{
      elements: {
        footer: "hidden",
      },
    }}>
    <html lang="en">
      <body className={inter.variable}>
      <Theme>
        {children}
      </Theme>
      </body>
    </html>
    </ClerkProvider>
  );
}