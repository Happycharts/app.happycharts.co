"use client"
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs'
import { Theme } from '@radix-ui/themes';
import ServiceBell from "@servicebell/widget";

export const dynamic = "force-dynamic";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", weight: ["400","700"] });

ServiceBell("init", "b951bf1ae1c8405b8f7a47ae2a153512", {
  /**
   * Whether or not to hide the widget initially.
   *
   * Defaults to false.
   */
  hidden: false,

  /**
   * Which side to render the widget on, 'left' or 'right'.
   *
   * Defaults to 'right'.
   */
  position: "right",
  
  /**
   * Whether or not to connect the widget on init, or manually later.
   * If the client has recently connected, they will connect anyway
   * despite this setting to allow for navigation and refreshes.
   *
   * Defaults to true.
   */
  connect: true,
  
  /**
   * Which design to use for the launcher, 'pill' or 'video'. Pill
   * is the small circle design that is used on smaller devices.
   * Video is the larger widget. Even if 'video' is specified,
   * 'pill' will be used on smaller devices.
   *
   * Defaults to 'video'.
   */
  launcher: 'pill',
  
  /**
   * Class name to use as selector for sensitive elements, causes
   * them not to be sent when viewing a visitor's screen. Should not
   * include selector characters like . or #, cannot be an arbitrarily
   * complex selector.
   *
   * Defaults to 'sb-block'.
   */
  blockClass: "sb-block",
  
  /**
   * How the widget initializes itself. It has three possible values.
   *
   * "retrigger" The widget will re-establish its session on each page load. 
   *     This is the default mode.
   *
   * "iframe-jit" The widget loads the page into an iframe
   *     when an agent connects. After that the widget will be continuously 
   *     connected as they navigate the site.
   *
   * Defaults to 'retrigger'
   */
  mode: "retrigger"
})

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
  