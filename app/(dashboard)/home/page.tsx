"use client"
import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useUser, useOrganization } from "@clerk/nextjs";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from '@/app/utils/supabase/client';
import { AnalyticsBrowser } from '@segment/analytics-next'
import { useClerk } from "@clerk/nextjs";
import { Input } from '@/components/ui/input';
import CurrencyInput from 'react-currency-input-field';
import { ServiceBellInitializer } from '@/components/ServiceBellInitializer'; // Import the new component

type MerchantData = {
  id: string;
  organization: string;
  onboarding_link: string | null;
};

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const user = useUser();
  const { organization, membership } = useOrganization();
  const firstName = user?.user?.firstName;
  const lastName = user?.user?.lastName;
  const orgName = useOrganization().organization?.name;
  const { session } = useClerk();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isStripeConnected, setIsStripeConnected] = useState(false);
  const [merchantData, setMerchantData] = useState<MerchantData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productInterval, setProductInterval] = useState('monthly');
  const [contentUrl, setContentUrl] = useState(''); // Change the default value here
  const userId = useUser()?.user?.id;
  const orgId = useOrganization()?.organization?.id;
  const name = useUser()?.user?.firstName || useUser()?.user?.lastName;
  const email = useUser()?.user?.primaryEmailAddress?.emailAddress;

  const supabase = createClient();
  const analytics = AnalyticsBrowser.load({ writeKey: process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY || '' });

  useEffect(() => {
    let isMounted = true;
    const fetchDataAndCheckAdmin = async () => {
      if (!user?.user?.id || !organization?.id) return;
      <ServiceBellInitializer /> 
      setIsLoading(true);
  
      const adminStatus = checkIfUserIsAdmin();
      if (isMounted) {
        setIsAdmin(adminStatus);
      }
  
      // Fetch existing merchant data
      const { data: existingMerchant, error: merchantError } = await supabase
        .from('merchants')
        .select('*')
        .eq('organization', organization.id)
        .single();
  
      if (merchantError && merchantError.code !== 'PGRST116') {
        console.error("Error fetching merchant data:", merchantError);
      } else if (!existingMerchant) {
        // If no merchant exists and user is admin, create one
        if (adminStatus) {
          try {
            const response = await fetch('/api/connect_links/generate', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                first_name: user.user?.firstName,
                last_name: user.user?.lastName,
                email: user.user?.primaryEmailAddress?.emailAddress,
                organization: organization.id,
                created_by: user.user?.id,
              }),
            });
  
            if (response.ok) {
              const data = await response.json();
              if (isMounted) {
                setMerchantData({
                  id: data.id,
                  organization: organization.id,
                  onboarding_link: data.url,
                });
                setIsStripeConnected(true);
              }
            } else {
              console.error('Error creating merchant:', await response.json());
            }
          } catch (error) {
            console.error('Error creating merchant:', error);
          }
        }
      } else if (existingMerchant) {
        if (isMounted) {
          setMerchantData(existingMerchant);
          setIsStripeConnected(!!existingMerchant.onboarding_link);
        }
      }
  
      setIsLoading(false);
    };
  
    fetchDataAndCheckAdmin();
  
    return () => {
      isMounted = false;
    };
  }, [user?.user?.id, organization?.id, membership]);

  function checkIfUserIsAdmin(): boolean {
    if (!membership) return false;
    console.log("User role:", membership.role);
    return membership.role === 'org:admin' || membership.role === 'admin';
  }

  const handleProductSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!productName || !productPrice || !orgId || !merchantData?.id) return;
  
    const productData = {
      name: productName,
      price: parseFloat(productPrice), // This will convert the string to a float
      organization: orgId,
      merchant: merchantData.id,
      interval: productInterval,
      private_url: contentUrl,
    };
  
    console.log('Sending product data:', productData);
  
    try {
      const response = await fetch('/api/products/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });
  
      if (response.ok) {
        const data = await response.json();
        console.log('Product inserted successfully:', data);
        setProductName('');
        setProductPrice('');
      } else {
        const errorData = await response.text();
        console.error('Error inserting product. Status:', response.status, 'Data:', errorData);
      }
    } catch (error) {
      console.error('Error inserting product:', error);
    }
  };

  const SkeletonContent = () => (
    <>
      <Card className="w-full max-w-4xl mx-auto border-black border-opacity-20 rounded-lg mb-8">
        <CardContent className="p-8">
          <Skeleton className="h-10 w-3/4 mx-auto mb-8" />
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8 mb-8">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="w-full">
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-6 w-1/2 mb-2" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          </div>
          <Skeleton className="h-20 w-full mb-8" />
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
          </div>
        </CardContent>
      </Card>
      <Card className="w-full max-w-4xl mx-auto shadow-lg border-black border-opacity-20 rounded-lg mt-8">
        <CardContent className="p-8">
          <Skeleton className="h-10 w-1/2 mb-6" />
          <Skeleton className="h-6 w-3/4 mb-6" />
          {[1, 2, 3, 4].map((_, index) => (
            <div key={index} className="mb-6">
              <Skeleton className="h-8 w-3/4 mb-3" />
              <Skeleton className="h-6 w-full mb-4" />
              <Skeleton className="h-10 w-40" />
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );

  const stripeConnectUrl = merchantData?.onboarding_link || `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=ca_Qa1YXbHMD2SL28qGP1igjAmJyc3oeq6W&scope=read_write&redirect_uri=https://app.happybase.co/portals`;

  return (
    <div className="container mx-auto p-6 bg-white min-h-screen">
      {loading ? (
        <SkeletonContent />
      ) : (
        <>
          {/* New Walkthrough Card */}
          <Card className="w-full max-w-4xl mx-auto shadow-lg border-black border-opacity-20 rounded-lg mt-8">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-black mb-6 text-left">Hey {user.user?.firstName} 👋, let's get your paywall started!</h2>
              <p className="text-lg text-black mb-6 text-left">Follow these steps to get set up and start using our platform effectively.</p>
              <ol className="space-y-6">
              <li className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-black mb-3">1. Get Support</h3>
                <p className="text-black mb-4">Get in touch with our team to help you get started</p>
                <Link href="https://wa.me/18657763192">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <img src="https://asset.brandfetch.io/id6Zq084G_/idNMPUs75U.svg" className="h-4 w-4" />
                    <span>Chat on WhatsApp</span>
                  </Button>
                </Link>
              </li>
              <li className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-black mb-3">2. Connect with Stripe</h3>
                <p className="text-black mb-4">Connect a Stripe account so you can start setting rates for your creations</p>
                {isAdmin ? (
                  <Link href={merchantData?.onboarding_link || '#'}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2"
                      disabled={!merchantData?.onboarding_link}
                    >
                      <img src="https://cdn.iconscout.com/icon/free/png-256/free-stripe-s-logo-icon-download-in-svg-png-gif-file-formats--technology-social-media-company-brand-vol-6-pack-logos-icons-3030363.png" className="h-4 w-4" />
                      <span>{merchantData?.onboarding_link ? 'Complete Stripe Onboarding' : 'Loading...'}</span>
                    </Button>
                  </Link>
                ) : (
                  <Button variant="outline" size="sm" disabled className="flex items-center space-x-2">
                    <img src="https://cdn.iconscout.com/icon/free/png-256/free-stripe-s-logo-icon-download-in-svg-png-gif-file-formats--technology-social-media-company-brand-vol-6-pack-logos-icons-3030363.png" className="h-4 w-4" />
                    <span>Connect with Stripe</span>
                  </Button>
                )}
              </li>
                <li className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-black mb-3">3. Create a portal</h3>
                  <p className="text-black mb-4">Use over 40+ tools or even custom resources to power your portal</p>
                  <div className="flex items-center space-x-2">
                    <div style={{
                      position: 'relative',
                      paddingBottom: 'calc(51.36054421768708% + 41px)',
                      height: 0,
                      width: '100%'
                    }}>
                      <iframe
                        src="https://demo.arcade.software/lsJDEvQIgtCwmOk3Yyh6?embed&show_copy_link=true"
                        title="localhost:3000/apps"
                        frameBorder="0"
                        loading="lazy"
                        allow="clipboard-write"
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          colorScheme: 'light'
                        }}
                      ></iframe>
                    </div>
                  </div>
                </li>
                <li className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-black mb-3">4. Share your portal link</h3>
                  <p className="text-black mb-4">Start sharing your portal with your audience so you can get paid!</p>
                </li>
              </ol>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
