import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';
import { getAuth } from '@clerk/nextjs/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-08-16',
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  console.log('Received body:', body);
  const { userId } = getAuth(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, url, appName, contentUrl, merchant, price, interval } = body;

  try {
    const supabase = createClient();

    // Check if the app exists and belongs to the user
    const { data: app, error: appError } = await supabase
      .from('apps')
      .select('id')
      .eq('id', id)
      .eq('creator_id', userId)
      .single();

    if (appError || !app) {
      return NextResponse.json({ error: 'App not found or you do not have permission' }, { status: 404 });
    }

    // Create Stripe product
    const product = await stripe.products.create({
      name: appName,
    }, {
      stripeAccount: merchant.id,
    });
    
    type Interval = 'month' | 'year' | 'week' | 'day';

    const intervalMap: {
      monthly: Interval;
      yearly: Interval;
      weekly: Interval;
      daily: Interval;
    } = {
      monthly: 'month',
      yearly: 'year',
      weekly: 'week',
      daily: 'day',
    };
    
    const validIntervals = Object.keys(intervalMap);
    
    if (!validIntervals.includes(interval)) {
      return NextResponse.json({ error: 'Invalid interval' }, { status: 400 });
    }
    
    const stripePrice = await stripe.prices.create({
      product: product.id,
      unit_amount: price * 100, // Stripe expects amount in cents
      currency: 'usd',
      recurring: { interval: intervalMap[interval as keyof typeof intervalMap] },
    }, {
      stripeAccount: merchant.id,
    });     

    // Create payment link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: stripePrice.id,
          quantity: 1,
        },
      ],
    }, {
      stripeAccount: merchant.id,
    });    

    // Create broadcast record
    const { data: broadcast, error: broadcastError } = await supabase
      .from('portals')
      .insert({
        id: id,
        creator_id: userId,
        url: url,
        content_url: contentUrl,
        product_id: product.id,
        merchant: merchant,
        price: price,
        interval: interval,
        stripe_price_id: stripePrice.id,
        payment_link: paymentLink.url,
      })
      .select()
      .single();

    if (broadcastError) {
      console.error('Error creating broadcast:', broadcastError);
      return NextResponse.json({ error: 'Failed to create broadcast' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Broadcast created successfully', broadcast, paymentLink: paymentLink.url }, { status: 200 });
  } catch (error) {
    console.error('Error in broadcast creation:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}