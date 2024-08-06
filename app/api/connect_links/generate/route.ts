import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import { createClient } from '@/app/utils/supabase/server';
import { clerkClient } from '@clerk/nextjs/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-08-16',
});

export async function POST(req: NextRequest) {
  try {
    const { orgId } = auth();

    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const userId = data.created_by;

    const supabase = createClient();

    // Get the user's email
    const user = await clerkClient().users.getUser(userId);
    const email = user.emailAddresses[0].emailAddress;
    console.log('User email:', email);

    // Create Stripe account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
    console.log('Stripe account created:', account.id);

    // Create account link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: 'https://app.happybase.co/refresh',
      return_url: 'https://app.happybase.co/home',
      type: 'account_onboarding',
    });
    console.log('Stripe account link created:', accountLink.url);

    // Insert data into Supabase
    const { data: insertData, error } = await supabase
      .from('merchants')
      .insert({
        id: account.id,
        first_name: data.first_name,
        last_name: data.last_name,
        email: email,
        organization: data.organization,
        onboarding_link: accountLink.url,
      });

    if (error) {
      console.error('Error inserting into Supabase:', error);
      return NextResponse.json({ error: 'Error inserting into database' }, { status: 500 });
    }
    console.log('Data inserted into Supabase:', insertData);

    // Update user metadata
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        organization_id: orgId,
        onboarding_link: accountLink.url,
      },
    });

    return NextResponse.json({ id: account.id, url: accountLink.url }, { status: 200 });
  } catch (error) {
    console.error('Error creating account link:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}