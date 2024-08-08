// pages/api/connect_links/refresh.js
import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import { createClient } from '@/app/utils/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-08-16',
});

export async function GET(req: NextRequest) {
  try {
    const { orgId } = auth();

    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();

    // Fetch the existing merchant data
    const { data: existingMerchant, error: merchantError } = await supabase
      .from('merchants')
      .select('*')
      .eq('organization', orgId)
      .single();

    if (merchantError && merchantError.code !== 'PGRST116') {
      console.error("Error fetching merchant data:", merchantError);
      return NextResponse.json({ error: 'Error fetching merchant data' }, { status: 500 });
    }

    // Create a new account link
    const accountLink = await stripe.accountLinks.create({
      account: existingMerchant.id,
      refresh_url: 'https://app.happybase.co/api/connect_links/refresh',
      return_url: 'https://app.happybase.co/home',
      type: 'account_onboarding',
    });
    console.log('Stripe account link created:', accountLink.url);

    // Redirect the user to the new account link
    return NextResponse.redirect(accountLink.url);
  } catch (error) {
    console.error('Error creating account link:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}