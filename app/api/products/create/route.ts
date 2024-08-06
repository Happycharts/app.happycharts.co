  import { NextRequest, NextResponse } from 'next/server';
  import { createClient } from '@/app/utils/supabase/server';
  import { auth } from '@clerk/nextjs/server';
  import Stripe from 'stripe';

  interface ProductData {
    name: string;
    price: string;
    organization: string;
    merchant: string;
    interval: string;
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-08-16' });

  export async function POST(request: NextRequest) {
    const supabase = createClient();
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
      const body = await request.json();
      console.log('Received body:', body);

      const { name, price, organization, merchant, interval, private_url } = body;

      if (!name || price === undefined || !organization || !merchant || !interval || !private_url) {
        return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
      }

      // Ensure price is a number and has at most 2 decimal places
      const formattedPrice = parseFloat(price.toFixed(2));

      // Create product in Stripe
      const stripeProduct = await stripe.products.create({
        name,
        type: 'service',
      });
      // Determine interval and interval_count for Stripe
      let stripeInterval: 'month' | 'year';
      let intervalCount: number;

      switch (interval) {
        case 'monthly':
          stripeInterval = 'month';
          intervalCount = 1;
          break;
        case 'quarterly':
          stripeInterval = 'month';
          intervalCount = 3;
          break;
        case 'yearly':
          stripeInterval = 'year';
          intervalCount = 1;
          break;
        default:
          return NextResponse.json({ message: 'Invalid interval' }, { status: 400 });
      }

      // Create price in Stripe
      const stripePrice = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: Math.round(formattedPrice * 100), // Convert to cents
        currency: 'usd',
        recurring: {
          interval: stripeInterval,
          interval_count: intervalCount,
        },
      });

      // Insert product into Supabase
      const { data, error: productError } = await supabase
      .from('products')
      .insert([{
        id: stripeProduct.id,
        name,
        price: formattedPrice, // Use the formatted price
        organization,
        merchant,
        private_url,
        interval,
        stripe_price_id: stripePrice.id,
      }])
      .select();

      if (productError) throw productError;

      return NextResponse.json({ message: 'Product created successfully', data }, { status: 200 });
    } catch (error: unknown) {
      console.error('Error inserting product:', error);
      
      if (error instanceof Error) {
        return NextResponse.json({ message: 'Error inserting product', error: error.message }, { status: 500 });
      } else {
        return NextResponse.json({ message: 'An unknown error occurred' }, { status: 500 });
      }
    }
  }