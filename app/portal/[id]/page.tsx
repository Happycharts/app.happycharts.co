"use client"
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { createClerkSupabaseClient } from '@/app/utils/supabase/clerk'
import Logo from '@/public/happybase.svg'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useUser, useOrganization } from '@clerk/nextjs';

export default function BroadcastPage() {
  const [broadcast, setBroadcast] = useState(null)
  const [loading, setLoading] = useState(true)
  const [companyName, setCompanyName] = useState('');
  const [companyLogo, setCompanyLogo] = useState('');
  const [url, setUrl] = useState('')
  const [inviteeEmail, setInviteeEmail] = useState(''); 
  const [inviteLink, setInviteLink] = useState(''); // New state for invite link
  const [price, setPrice] = useState(''); // New state for price
  const [interval, setInterval] = useState(''); // New state for interval
  const { user } = useUser();
  const params = useParams()
  const { id } = params
  const { organization } = useOrganization();


  useEffect(() => {
    const fetchBroadcast = async () => {
      if (!id || !user?.id || !organization?.id) {
        console.error('ID or user ID or organization ID is not provided')
        setLoading(false)
        return
      }
  
      console.log('Fetching broadcast with ID:', id)
  
      const supabase = createClerkSupabaseClient()
      const { data: broadcastData, error: broadcastError } = await supabase
        .from('portals')
        .select('*')
        .eq('id', id)
        .maybeSingle()
  
      if (broadcastError) {
        console.error('Error fetching broadcast:', broadcastError)
        setLoading(false)
        return
      }
  
      if (!broadcastData) {
        console.error('Broadcast not found')
        setLoading(false)
        return
      }

      setBroadcast(broadcastData)
      setUrl(broadcastData.url) // Ensure that the URL is correctly set from the data
      setPrice(broadcastData.price) // Update the price state
      setInterval(broadcastData.interval) // Update the interval state
      setInviteLink(broadcastData.payment_link) // Update the invite link state
      setLoading(false)
    }
  
    fetchBroadcast()
  }, [id, user?.id, organization?.id])
  
  

  if (loading) return <div>Loading...</div>
  if (!broadcast) return <div>Broadcast not found</div>

  let formattedInterval = '';
  switch (interval) {
    case 'monthly':
      formattedInterval = '/mo';
      break;
    case 'quarterly':
      formattedInterval = '/qtr';
      break;
    case 'yearly':
      formattedInterval = '/yr';
      break;
    default:
      formattedInterval = '';
  }


  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      {url ? (
        <iframe
          src={url}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Embedded Content"
        />
      ) : (
        <p>App URL not found</p>
      )}

      {/* Powered by Happybase widget */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: 'white',
        padding: '10px',
        borderRadius: '5px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        zIndex: 1000
      }}>
        <span className='mr-2'>Powered by Happybase</span>
        <Logo />
      </div>

      {/* Hovering link input */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        backgroundColor: 'white',
        padding: '10px',
        borderRadius: '5px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        zIndex: 1000
      }}>
        <p style={{ marginBottom: '5px' }}>Want access? Sign up now for ${price}{formattedInterval}</p>
        <a href={inviteLink} target="_blank" rel="noopener noreferrer">
          <Button className="flex w-full bg-black items-center space-x-2">
            <img src="https://cdn.iconscout.com/icon/free/png-256/free-stripe-s-logo-icon-download-in-svg-png-gif-file-formats--technology-social-media-company-brand-vol-6-pack-logos-icons-3030363.png" className="h-4 w-4" />
            <span className='text-white hover:text-black'>Pay with Stripe</span>
          </Button>
        </a>
      </div>
    </div>
  )
}
