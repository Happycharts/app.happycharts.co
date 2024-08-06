import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { clerkClient } from '@clerk/nextjs/server';
import { Analytics } from '@segment/analytics-node'
const analytics = new Analytics({ writeKey: process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY! });
import { Resend } from 'resend';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-08-16',
});

export async function POST(request: Request) {
  const sig = request.headers.get('stripe-signature');
  const body = await request.text();

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig!,
      process.env.STRIPE_CONNECT_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Define account variable here
  let account: Stripe.Account;

  // Handle the event
  switch (event.type as Stripe.Event.Type) {
    case 'account.updated':
      account = event.data.object as Stripe.Account;
      analytics.track(
        {
          userId: account.id,
          event: 'Account Updated',
          properties: {
            email: account.email,
            name: account.company,
            createdAt: account.created,
          },
        }
      )
      break;

    case 'balance.available':
      break;

    case 'account.application.authorized':
      account = event.data.object as Stripe.Account;
      console.log('Application authorized!');
      analytics.track(
        {
          userId: account.id,
          event: 'Application Authorized',
          properties: {
            email: account.email,
            name: account.company,
            createdAt: account.created,
          },
        }
      )
      break;

    case 'payment_intent.succeeded':
      console.log('PaymentIntent was successful!');
      // Handle successful payment intent

      break;

    case 'payout.failed':
      const invoice = event.data.object as Stripe.Invoice;
      console.log('Invoice was paid!');
      // Handle paid invoice
      break;

    case 'account.application.deauthorized':
      const failedInvoice = event.data.object as Stripe.Invoice;
      console.log('Application deauthorized!');
      // Handle failed invoice payment
      break;

    case 'account.external_account.updated':
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}