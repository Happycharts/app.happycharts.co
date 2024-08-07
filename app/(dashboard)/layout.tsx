"use client"

import { Inter } from "next/font/google"
import "./globals.css"
import Link from 'next/link'
import { PanelsTopLeft } from "lucide-react"

import { cn } from "@/app/utils/utils"
import { useStore } from "@/app/hooks/use-store"
import { Button } from "@/components/ui/button"
import { Menu } from "@/components/sidebar/menu"
import { useSidebarToggle } from "@/app/hooks/use-sidebar-toggle"
import { SidebarToggle } from "@/components/sidebar/sidebar-toggle"
import Logo from "@/public/happybase.svg"
import Intercom from '@intercom/messenger-js-sdk';
import { useUser, useOrganization } from "@clerk/nextjs"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", weight: ["400", "700"] })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const user = useUser();
  const org = useOrganization();
  Intercom({
    app_id: 'kz8t3t7h',
    user_id: user.user?.id, // IMPORTANT: Replace "user.id" with the variable you use to capture the user's ID
    name: user.user?.id, // IMPORTANT: Replace "user.name" with the variable you use to capture the user's name
    email: user.user?.id, // IMPORTANT: Replace "user.email" with the variable you use to capture the user's email
  });
  const sidebar = useStore(useSidebarToggle, (state) => state);

  if(!sidebar) return null;

  return (
    
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex`}>
      <aside
          className={cn(
            "fixed top-0 left-0 z-20 h-screen -translate-x-full lg:translate-x-0 transition-[width] ease-in-out duration-300",
            sidebar?.isOpen === false ? "w-[90px]" : "w-72"
          )}
        >
          <SidebarToggle isOpen={sidebar?.isOpen} setIsOpen={sidebar?.setIsOpen} />
          <div className="relative h-full flex flex-col px-3 py-4 overflow-y-auto shadow-md dark:shadow-zinc-800">
            <Button
              className={cn(
                "transition-transform ease-in-out duration-300 mb-1",
                sidebar?.isOpen === false ? "translate-x-1" : "translate-x-0"
              )}
              variant="link"
              asChild
            >
              <Link href="/dashboard" className="flex items-center gap-2">
                <Logo className="w-5 h-5 mr-1" />
                <h1
                  className={cn(
                    "font-bold text-lg whitespace-nowrap transition-[transform,opacity,display] ease-in-out duration-300",
                    sidebar?.isOpen === false
                      ? "-translate-x-96 opacity-0 hidden"
                      : "translate-x-0 opacity-100"
                  )}
                >
                Happybase
                </h1>
              </Link>
            </Button>
            <Menu isOpen={sidebar?.isOpen} />
          </div>
        </aside>
        <main className={cn(
          "flex-grow transition-all duration-300 ease-in-out",
          sidebar?.isOpen === false ? "lg:ml-[90px]" : "lg:ml-72"
        )}>
          {children}
        </main>
      </body>
    </html>
  )
}