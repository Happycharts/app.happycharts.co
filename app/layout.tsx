"use client"
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider, useAuth, useUser, useOrganization } from '@clerk/nextjs'
import { Theme } from '@radix-ui/themes';
import Intercom from '@intercom/messenger-js-sdk';
import { Analytics } from '@customerio/cdp-analytics-node'

export const dynamic = "force-dynamic";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", weight: ["400","700"] });
const userId = useUser().user?.id;
const userName = useUser().user?.firstName + " " + useUser().user?.lastName;
const userEmail = useUser().user?.emailAddresses[0].emailAddress;
const userCreatedAt = useUser().user?.createdAt;

const analytics = new Analytics({
  writeKey: '0d586efab7e897a49bda',
  host: 'https://cdp.customer.io',
})

Intercom({
  app_id: 'kz8t3t7h',
  user_id: userId,
  name: userName,
  email: userEmail,
  created_at: userCreatedAt ? Math.floor(userCreatedAt.getTime() / 1000) : undefined,
});

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
      </Theme>
      </body>
    </html>
    </ClerkProvider>
  );
}
  