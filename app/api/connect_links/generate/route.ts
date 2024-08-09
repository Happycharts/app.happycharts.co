import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import { createClient } from '@/app/utils/supabase/server';
import { clerkClient } from '@clerk/nextjs/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-08-16',
});

export async function POST(req: NextRequest) {
  console.log('POST function started');
  try {
    const { orgId } = auth();
    console.log('orgId from auth:', orgId);

    if (!orgId) {
      console.log('Unauthorized: No orgId found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    console.log('Received data:', data);
    const userId = data.created_by;
    console.log('userId:', userId);

    const supabase = createClient();
    console.log('Supabase client created');

    // Get the user's email
    console.log('Fetching user email from Clerk');
    const user = await clerkClient().users.getUser(userId);
    const email = user.emailAddresses[0].emailAddress;
    console.log('User email:', email);

    // Create or retrieve the Stripe account
    console.log('Checking for existing merchant');
    const { data: existingMerchant, error: merchantError } = await supabase
      .from('merchants')
      .select('*')
      .eq('organization', orgId)
      .single();

    if (merchantError && merchantError.code !== 'PGRST116') {
      console.error("Error fetching merchant data:", merchantError);
      return NextResponse.json({ error: 'Error fetching merchant data', details: merchantError }, { status: 500 });
    }

    let account;
    if (existingMerchant) {
      console.log('Existing merchant found, retrieving Stripe account');
      account = await stripe.accounts.retrieve(existingMerchant.id);
    } else {
      console.log('Creating new Stripe account');
      account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      console.log('Stripe account created:', account.id);
    }

    // Create account link
    console.log('Creating Stripe account link');
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: 'https://app.happybase.co/api/connect_links/refresh',
      return_url: 'https://app.happybase.co/home',
      type: 'account_onboarding',
    });
    console.log('Stripe account link created:', accountLink.url);

    // Insert or update data in Supabase
    if (existingMerchant) {
      console.log('Updating existing merchant in Supabase');
      const { data: updateData, error: updateError } = await supabase
        .from('merchants')
        .update({
          onboarding_link: accountLink.url,
        })
        .eq('id', existingMerchant.id);

      if (updateError) {
        console.error('Error updating Supabase:', updateError);
        return NextResponse.json({ error: 'Error updating database', details: updateError }, { status: 500 });
      }
      console.log('Data updated in Supabase:', updateData);
    } else {
      console.log('Inserting new merchant into Supabase');
      const { data: insertData, error: insertError } = await supabase
        .from('merchants')
        .insert({
          id: account.id,
          first_name: data.first_name,
          last_name: data.last_name,
          email: email,
          organization: data.organization,
          onboarding_link: accountLink.url,
        });

      if (insertError) {
        console.error('Error inserting into Supabase:', insertError);
        return NextResponse.json({ error: 'Error inserting into database', details: insertError }, { status: 500 });
      }
      console.log('Data inserted into Supabase:', insertData);
    }

    // Update user metadata
    console.log('Updating user metadata in Clerk');
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        organization_id: orgId,
        onboarding_link: accountLink.url,
      },
    });

    console.log('Function completed successfully');
    return NextResponse.json({ id: account.id, url: accountLink.url }, { status: 200 });
  } catch (error) {
    console.error('Unhandled error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error }, { status: 500 });
  }
}