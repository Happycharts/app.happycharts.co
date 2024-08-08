"use client"
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider, useAuth, useUser, useOrganization } from '@clerk/nextjs'
import { Theme } from '@radix-ui/themes';
import { JitsuProvider } from "@jitsu/jitsu-react";

export const dynamic = "force-dynamic";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", weight: ["400","700"] });


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <JitsuProvider options={{ host: "https://cdp.happybase.co" }} >
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
    </JitsuProvider>
  );
}
  