"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import React, { useEffect, useState } from 'react';
import { useOrganization, useUser } from '@clerk/nextjs';
import { createClerkSupabaseClient } from '@/app/utils/supabase/clerk';
import Link from 'next/link';
import { PlusCircle, FileBox, Trash2, AlertCircle, Copy, RadioTower, ChevronsUpDownIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Toast } from '@/components/ui/toast'
import { toast, useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster";
import Stripe from 'stripe';
import { Input } from "@/components/ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandItem, CommandDialog, CommandGroup, CommandEmpty } from "@/components/ui/command";
import { Check } from "lucide-react";
import { ChevronUpDownIcon } from "@heroicons/react/24/solid";
import { cn } from "@/app/utils/utils";
import { Select, SelectItem, SelectTrigger, SelectContent, SelectGroup, SelectLabel, SelectValue } from "@/components/ui/select";
import { ChangeEvent } from 'react';
import CurrencyInput from 'react-currency-input-field';

type appData = {
  id: string;
  creator_id: string;
  portal_manager: string;
  name: string;
  url: string; // Add the URL field to the appData type
};

const appLogos = {
  "Coda": "https://upload.wikimedia.org/wikipedia/en/3/3f/Coda_%28document_editor%29_logo.png",
  "Hex": "https://cdn.prod.website-files.com/5d1126db676120bb4fe43762/63fd16cde55f78843fae69d8_e4184b933d3022409dd3d63191e1b123f2618cd9-250x251.png",
  "Figma": "https://asset.brandfetch.io/idZHcZ_i7F/idbeZ1Yw2c.svg",
  "Obsidian": "https://asset.brandfetch.io/idGpyxH_Fa/idjJkC-FjU.svg",
  "Miro": "https://asset.brandfetch.io/idAnDTFapY/idFdbEywEz.svg",
  "Cal.com": "https://asset.brandfetch.io/idK1CiIFAV/ide-zRSldu.svg",
  "Clay": "https://asset.brandfetch.io/idBx-psh22/idTacOVK3f.png",
  "Folk": "https://asset.brandfetch.io/idyOzfVzQG/id3s40qjnH.svg",
  "Notion": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Notion-logo.svg/2048px-Notion-logo.svg.png",
  "Observable": "https://avatars.githubusercontent.com/u/30080011?s=280&v=4",
  "Deepnote": "https://cdn-images-1.medium.com/max/1200/1*Geecfuc_bb_Fa3i4zWnsjQ.png",
};

export default function Apps() {
  const { organization } = useOrganization();
  const { user } = useUser();
  const [Apps, setApps] = useState<appData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [appToDelete, setappToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [appToBroadcast, setAppToBroadcast] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  const fullName = user?.fullName;
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productInterval, setProductInterval] = useState('monthly');
  const [contentUrl, setContentUrl] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [openProductCombobox, setOpenProductCombobox] = React.useState(false);
  const [broadcastedApps, setBroadcastedApps] = useState<string[]>(() => {
    const saved = localStorage.getItem('broadcastedApps');
    return saved ? JSON.parse(saved) : [];
  });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-08-16',
  });

  useEffect(() => {
    let isMounted = true;
    const fetchApps = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      const supabase = createClerkSupabaseClient();

      // Fetch apps
      const { data: appsData, error: appsError } = await supabase
        .from('apps')
        .select('*')
        .eq('creator_id', user.id);

      if (appsError) {
        console.error(appsError);
      } else if (isMounted) {
        setApps(appsData || []);
      }

      setIsLoading(false);
    };

    fetchApps();
    
    

    return () => {
      isMounted = false;
    };
  }, [user?.id, organization?.id]);

  useEffect(() => {
    localStorage.setItem('broadcastedApps', JSON.stringify(broadcastedApps));
  }, [broadcastedApps]);

  const deleteApp = async () => {
    if (!user?.id || !appToDelete) return;

    try {
      const response = await fetch(`/api/apps/delete?id=${appToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete app');
      }

      // Remove the deleted app from the state
      setApps(Apps.filter(app => app.id !== appToDelete));
      setappToDelete(null);
      toast({
        title: "App deleted successfully!",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Failed to delete app",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const broadcastApp = async () => {
    if (!appToBroadcast) return;

    try {
      const orgId = organization?.id;
      const email = user?.primaryEmailAddress?.emailAddress;

      if (!orgId || !email) {
        throw new Error('Missing required fields');
      }

      // Check if a merchant account exists
      const supabase = createClerkSupabaseClient();
      const { data: merchantData, error: merchantError } = await supabase
        .from('merchants')
        .select('*')
        .eq('organization', orgId);

      if (merchantError) {
        console.error(merchantError);
        throw new Error('Failed to fetch merchant account');
      }

      if (!merchantData || merchantData.length === 0) {
        throw new Error('You need to finish onboarding!');
      }

      if (!productName || !productPrice || !productInterval) {
        throw new Error('Missing required fields');
      }

      const app = Apps.find(app => app.id === appToBroadcast);
      if (!app) {
        throw new Error('App not found');
      }

      const portalData = {
        id: app.id,
        url: app.url,
        appName: productName,
        merchant: merchantData[0].id,
        price: parseFloat(productPrice),
        interval: productInterval,
      };

      const broadcastResponse = await fetch('/api/portals/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(portalData),
      });
    

      if (!broadcastResponse.ok) {
        console.error('Error creating portal:', broadcastResponse.status, broadcastResponse.statusText);
        const errorData = await broadcastResponse.json();
        console.error('Error data:', errorData);
        throw new Error('Failed to create portal');
      }

      const data = await broadcastResponse.json();
      toast({
        title: "App broadcasted successfully!",
        description: `Product: ${app.name}`,
      });
      setAppToBroadcast(null);
      setBroadcastedApps([...broadcastedApps, appToBroadcast]);
    } catch (error) {
      console.error('Error creating portal:', error);
      toast({
        title: "Failed to create portal",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to clipboard!",
      });
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };

  // Add logging to ensure state updates are correct
  useEffect(() => {
    console.log('Apps:', Apps);
    console.log('appToDelete:', appToDelete);
  }, [Apps, appToDelete]);

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="shadow-lg">
        <CardHeader className="bg-gray-50">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold text-gray-800">Your Data Apps</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : Apps.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No data Apps</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding a new data app.</p>
              <div className="mt-6">
                <Link href="/apps/add">
                  <Button className="bg-black hover:bg-primary text-white">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Data app
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>App</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Apps.map((app) => (
                  <TableRow key={app.id} className="hover:bg-gray-50">
                    <TableCell className="flex items-center space-x-3">
                      {appLogos[app.name as keyof typeof appLogos] && (
                        <img src={appLogos[app.name as keyof typeof appLogos]} alt={`${app.name} logo`} className="w-8 h-8" />
                      )}
                      <span className="font-medium">{productName}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={`https://app.happybase.co/portal/${app.id}`}
                          readOnly
                          className="w-full border rounded px-2 py-1"
                        />
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => copyToClipboard(`https://app.happybase.co/portal/${app.id}`)}>
                                <Copy className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Copy Link</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" className="mr-1">
                              <Link href={`/apps/${app.id}`}>
                                <FileBox className="h-4 w-4" />
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Open App</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mr-1"
                              onClick={() => {
                                setappToDelete(app.id);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Delete app</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className={`ml-1 ${broadcastedApps.includes(app.id) ? 'text-green-600 hover:text-green-700' : ''}`}
                              onClick={() => {
                                setAppToBroadcast(app.id);
                                setUrl(app.url); // Set the URL from the app data
                              }}
                            >
                              <RadioTower className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Create Portal</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Toaster />

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete App</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this app? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              deleteApp();
              setIsDeleteDialogOpen(false);
            }}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!appToBroadcast} onOpenChange={(open) => setAppToBroadcast(open ? appToBroadcast : null)}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Create a portal</DialogTitle>
            <DialogDescription>
              Create your portal and the terms of its access
            </DialogDescription>
          </DialogHeader>
          <Input
            type="text"
            placeholder="Portal Name"
            value={productName}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setProductName(e.target.value)}
          />
          <CurrencyInput
            id="product-price"
            name="product-price"
            placeholder="$5.00"
            defaultValue={productPrice}
            decimalsLimit={2}
            fixedDecimalLength={2}
            allowNegativeValue={false}
            prefix="$"
            onValueChange={(value) => setProductPrice(value || '')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a billing interval" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Intervals</SelectLabel>
                <SelectItem value="monthly" onClick={() => setProductInterval('monthly')}>Monthly</SelectItem>
                <SelectItem value="quarterly" onClick={() => setProductInterval('quarterly')}>Quarterly</SelectItem>
                <SelectItem value="yearly" onClick={() => setProductInterval('yearly')}>Yearly</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
            onClick={broadcastApp}
          >
            <span>Create Product and Broadcast</span>
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
