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

    // Create or retrieve the Stripe account
    let account;
    const { data: existingMerchant, error: merchantError } = await supabase
      .from('merchants')
      .select('*')
      .eq('organization', orgId)
      .single();

    if (merchantError && merchantError.code !== 'PGRST116') {
      console.error("Error fetching merchant data:", merchantError);
      return NextResponse.json({ error: 'Error fetching merchant data' }, { status: 500 });
    } else if (existingMerchant) {
      account = await stripe.accounts.retrieve(existingMerchant.id);
    } else {
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
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: 'https://app.happybase.co/api/connect_links/refresh',
      return_url: 'https://app.happybase.co/home',
      type: 'account_onboarding',
    });
    console.log('Stripe account link created:', accountLink.url);

    // Insert or update data in Supabase
    if (existingMerchant) {
      const { data: updateData, error: updateError } = await supabase
        .from('merchants')
        .update({
          onboarding_link: accountLink.url,
        })
        .eq('id', existingMerchant.id);

      if (updateError) {
        console.error('Error updating Supabase:', updateError);
        return NextResponse.json({ error: 'Error updating database' }, { status: 500 });
      }
      console.log('Data updated in Supabase:', updateData);
    } else {
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
        return NextResponse.json({ error: 'Error inserting into database' }, { status: 500 });
      }
      console.log('Data inserted into Supabase:', insertData);
    }

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