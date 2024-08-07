"use client"
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs'
import { Theme } from '@radix-ui/themes';
import { ServiceBellInitializer } from '@/components/ServiceBellInitializer'; // Import the new component

export const dynamic = "force-dynamic";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", weight: ["400","700"] });


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
        <ServiceBellInitializer /> 
      </Theme>
      </body>
    </html>
    </ClerkProvider>
  );
}
  