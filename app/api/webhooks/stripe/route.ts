import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { clerkClient, auth } from '@clerk/nextjs/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-08-16',
});

export async function POST(request: Request) {
  const sig = request.headers.get('stripe-signature');
  const body = await request.text();
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing STRIPE_WEBHOOK_SECRET' }, { status: 500 });
  }
  let event;

  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('Missing STRIPE_WEBHOOK_SECRET');
    }
    event = stripe.webhooks.constructEvent(
      body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  switch (event.type as Stripe.Event.Type) {
    case 'customer.created':
      case 'customer.created':
  const customer = event.data.object as Stripe.Customer;
  try {
    console.log('Customer created event tracked');
  } catch (error) {
    console.error('Failed to track customer created event:', error);
  }
  break;
  case 'charge.succeeded':
    const charge = event.data.object as Stripe.Charge;
    const chargeUserId = charge.customer as string;
    try {
      console.log('Charge succeeded event tracked');
    } catch (error) {
      console.error('Failed to track charge succeeded event:', error);
    }
    break;
      case 'payment_link.created':
        const payment_link = event.data.object as Stripe.PaymentLink;
        const linkCreatorId = payment_link.metadata?.created_by || 'unknown';
        try {
          console.log('Payment link created event tracked');
        } catch (error) {
          console.error('Failed to track payment link created event:', error);
        }
        break;
        case 'customer.updated':
          const updatedCustomer = event.data.object as Stripe.Customer;
          try {
            console.log('Customer updated event tracked');
          } catch (error) {
            console.error('Failed to track customer updated event:', error);
          }
          break;
          case 'checkout.session.completed':
            const session = event.data.object as Stripe.Checkout.Session;
            const customerEmail = session.customer_details?.email;
            const customerName = session.customer_details?.name;
            const userId = auth().userId;
            
            if (customerEmail) {
              try {
                const newUser = await clerkClient.users.createUser({
                  emailAddress: [customerEmail],
                  firstName: customerName?.split(' ')[0] || '',
                  lastName: customerName?.split(' ').slice(1).join(' ') || '',
                  publicMetadata: {
                    checkoutSessionId: session.id,
                    stripeCustomerId: session.customer as string,
                    customerEmail: customerEmail,
                  },
                  skipPasswordChecks: true,
                  skipPasswordRequirement: true,
                });
                console.log('Checkout completed event tracked');
              } catch (error) {
                console.error('Failed to create user or track checkout event:', error);
              }
            } else {
              console.log('Customer email not found in checkout session');
            }
            break;

    case 'invoice.paid':
      const invoice = event.data.object as Stripe.Invoice;
      console.log('Invoice was paid!');
      // Handle paid invoice
      break;
    case 'invoice.payment_failed':
      const failedInvoice = event.data.object as Stripe.Invoice;

      console.log('Invoice payment failed!');
      // Handle failed invoice payment
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}