"use client"
import { use, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { Dialog, DialogTrigger, DialogTitle, DialogDescription, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Toast } from '@/components/ui/toast'
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useOrganization } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs"

const apps = [
  {
    name: "Coda",
    description: "Paywall a Coda document",
    iconSrc: "https://upload.wikimedia.org/wikipedia/en/3/3f/Coda_%28document_editor%29_logo.png"
  },
  {
    name: "Hex",
    description: "Paywall a Hex app",
    iconSrc: "https://cdn.prod.website-files.com/5d1126db676120bb4fe43762/63fd16cde55f78843fae69d8_e4184b933d3022409dd3d63191e1b123f2618cd9-250x251.png"
  },
  {
    name: "Figma",
    description: "Paywall an Figma app",
    iconSrc: "https://asset.brandfetch.io/idZHcZ_i7F/idbeZ1Yw2c.svg"
  },
  {
    name: "Obsidian",
    description: "Paywall a Obsidian Publish app",
    iconSrc: "https://asset.brandfetch.io/idGpyxH_Fa/idjJkC-FjU.svg"
  },
  {
    name: "Miro",
    description: "Paywall your Miro workspace",
    iconSrc: "https://asset.brandfetch.io/idAnDTFapY/idFdbEywEz.svg"
  },
  {
    name: "Cal.com",
    description: "Paywall your Cal.com Calendar",
    iconSrc: "https://asset.brandfetch.io/idK1CiIFAV/ide-zRSldu.svg"
  },
  {
    name: "Clay",
    description: "Paywall your Clay template",
    iconSrc: "https://asset.brandfetch.io/idBx-psh22/idTacOVK3f.png"
  },
  {
    name: "Folk",
    description: "Paywall your Folk CRM view",
    iconSrc: "https://asset.brandfetch.io/idyOzfVzQG/id3s40qjnH.svg"
  },
]

interface DialogState {
  [key: string]: boolean;
}

export default function AppsPage() {
    const { toast } = useToast()
    const [openDialogs, setOpenDialogs] = useState<DialogState>({})
    const org = useOrganization().organization?.id;
    const userName = useUser().user?.fullName;

    const domainMap = {
      'Coda': 'coda.io',
      'Hex': 'hex.tech',
      'Figma': 'figma.com',
      'Obsidian': 'obsidian.md',
      'Miro': 'miro.com',
      'Cal.com': 'cal.com',
      'Clay': 'clay.com',
      'Folk': 'folk.app',
      'Observable': 'observablehq.com'
    };
    
    const isValidUrl = (url: string, appName: string) => {
      try {
        const parsedUrl = new URL(url);
        return parsedUrl.hostname.endsWith(domainMap[appName as keyof typeof domainMap]);
      } catch {
        return false;
      }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>, appName: string) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const url = formData.get('sharing-url')?.toString() || '';
    
      if (!isValidUrl(url, appName)) {
        toast({
          title: 'Invalid URL',
          description: `Please enter a valid ${appName} URL.`,
          variant: 'destructive',
        });
        return;
      }
    
      try {
        const response = await fetch('/api/apps/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appName, url, userName }),
        });
    
        if (!response.ok) {
          throw new Error('Failed to add app');
        }
    
        toast({
          title: 'App Added',
          description: `${appName} has been added successfully.`,
        });
    
        setOpenDialogs(prev => ({ ...prev, [appName]: false }));
      } catch (error) {
        console.error(error);
        toast({
          title: 'Error',
          description: 'Failed to add app. Please try again.',
          variant: 'destructive',
        });
      }
    };

    return (
      <div className="container mx-auto pl-5 py-10">
        <h1 className="text-2xl font-bold mb-6">Add an application</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pr-5">
          {apps.map((app) => (
            <Dialog
              key={app.name}
              open={openDialogs[app.name]}
              onOpenChange={(open) => setOpenDialogs(prev => ({ ...prev, [app.name]: open }))}
            >
              <DialogTrigger asChild>
                <Card className="hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="flex flex-row items-center space-x-2">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <img
                        src={app.iconSrc}
                        alt={`${app.name} icon`}
                        width={25}
                        height={25}
                      />
                    </div>
                    <div>
                      <CardTitle>{app.name}</CardTitle>
                      <CardDescription>{app.description}</CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </DialogTrigger>
              <DialogContent className="bg-white">
                <DialogTitle>Connect {app.name}</DialogTitle>
                <DialogDescription>
                  {/* Render form based on app.name */}
                  {/* Example for Hex: */}
                  {app.name === 'Hex' && (
                  <form onSubmit={(e) => handleSubmit(e, app.name)}>
                    <p>Fill out your connection details to begin querying your data</p>
                    <div className="space-y-4 mt-4">
                      <Input name="sharing-url" placeholder="Your sharable Hex URL" />
                    </div>
                    <Button type="submit" className="w-full bg-black mt-4">Connect</Button>
                  </form>
                )}
                {app.name === 'Coda' && (
                  <form onSubmit={(e) => handleSubmit(e, app.name)}>
                    <p>Fill out your connection details to begin querying your data</p>
                    <div className="space-y-4 mt-4">
                      <Input name="sharing-url" placeholder="Your sharable Coda URL" />
                    </div>
                    <Button type="submit" className="w-full bg-black mt-4">Connect</Button>
                  </form>
                )}
                {app.name === 'Figma' && (
                  <form onSubmit={(e) => handleSubmit(e, app.name)}>
                    <p>Fill out your connection details to begin querying your data</p>
                    <div className="space-y-4 mt-4">
                      <Input name="sharing-url" placeholder="Your sharable Figma URL" />
                    </div>
                    <Button type="submit" className="w-full bg-black mt-4">Connect</Button>
                  </form>
                )}
                {app.name === 'Obsidian' && (
                  <form onSubmit={(e) => handleSubmit(e, app.name)}>
                    <p>Fill out your connection details to begin querying your data</p>
                    <div className="space-y-4 mt-4">
                      <Input name="sharing-url" placeholder="Your sharable Obsidian Publish URL" />
                    </div>
                    <Button type="submit" className="w-full bg-black mt-4">Connect</Button>
                  </form>
                )}
                {app.name === 'Miro' && (
                  <form onSubmit={(e) => handleSubmit(e, app.name)}>
                    <p>Fill out your connection details to begin querying your data</p>
                    <div className="space-y-4 mt-4">
                      <Input name="sharing-url" placeholder="Your sharable Miro workspace URL" />
                    </div>
                    <Button type="submit" className="w-full bg-black mt-4">Connect</Button>
                  </form>
                )}
                {app.name === 'Cal.com' && (
                  <form onSubmit={(e) => handleSubmit(e, app.name)}>
                    <p>Fill out your connection details to begin querying your data</p>
                    <div className="space-y-4 mt-4">
                      <Input name="sharing-url" placeholder="Your sharable Cal.com Calendar URL" />
                    </div>
                    <Button type="submit" className="w-full bg-black mt-4">Connect</Button>
                  </form>
                )}
                {app.name === 'Clay' && (
                  <form onSubmit={(e) => handleSubmit(e, app.name)}>
                    <p>Fill out your connection details to begin querying your data</p>
                    <div className="space-y-4 mt-4">
                      <Input name="sharing-url" placeholder="Your sharable Clay template URL" />
                    </div>
                    <Button type="submit" className="w-full bg-black mt-4">Connect</Button>
                  </form>
                )}
                {app.name === 'Folk' && (
                  <form onSubmit={(e) => handleSubmit(e, app.name)}>
                    <p>Fill out your connection details to begin querying your data</p>
                    <div className="space-y-4 mt-4">
                      <Input name="sharing-url" placeholder="Your sharable Folk CRM view URL" />
                    </div>
                    <Button type="submit" className="w-full bg-black mt-4">Connect</Button>
                  </form>
                )}
                </DialogDescription>
              </DialogContent>
            </Dialog>
          ))}
        </div>
        <Toaster />
      </div>
    )
  }
