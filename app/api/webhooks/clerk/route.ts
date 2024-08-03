import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent, clerkClient } from '@clerk/nextjs/server'
import Stripe from 'stripe';
import { createClient } from '@/app/utils/supabase/server';
import { Analytics } from '@segment/analytics-node'

const analytics = new Analytics({ writeKey: process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY! });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-08-16',
});

async function handleUserCreated(data: any) {
  console.log('User created:', data);
  analytics.identify({
    userId: data.id,
    traits: {
      email: data.email_addresses[0].email_address,
      name: data.first_name + ' ' + data.last_name,
      createdAt: data.created_at,
    },
  });
  analytics.track({
    userId: data.id,
    event: 'User Created',
    properties: {
      email: data.email_addresses[0].email_address,
      name: data.first_name + ' ' + data.last_name,
      createdAt: data.created_at,
    },
  });
  const userId = data.id;
  await clerkClient.users.updateUserMetadata(userId, {
    publicMetadata: {
      "onboarding_step": "create_organization"
    }
  });
}

async function handleOrganizationCreated(data: any) {
  console.log('Organization created:', data);
  const orgId = data.id;
  const userId = data.created_by;
 // Get the users email 
 
 const user = await clerkClient.users.getUser(userId);
 const email = user.emailAddresses[0].emailAddress;
  const account = await stripe.accounts.create({
    type: 'express',
    country: 'US',
    email: data.email_addresses[0].email_address,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });

  const supabase = createClient();

  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: 'https://app.happybase.co/refresh',
    return_url: 'https://app.happybase.co/home',
    type: 'account_onboarding',
  });

  await supabase
    .from('merchants')
    .insert({
      id: account.id,
      first_name: data.first_name,
      last_name: data.last_name,
      email: email as string,
      created_at: data.created_at,
      organization: data.name,
      onboarding_link: accountLink.url,
    });

    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        "organization_id": orgId
      }
    });
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        "onboarding_link": orgId
      }
    });
}

// Add other event handlers here...

export async function POST(req: Request) {
  const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!CLERK_WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local')
  }

  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occurred -- no svix headers', {
      status: 400
    })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload);

  const wh = new Webhook(CLERK_WEBHOOK_SECRET);

  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occurred', {
      status: 400
    })
  }

  switch (evt.type) {
    case 'user.created':
      await handleUserCreated(evt.data);
      break;
    case 'organization.created':
      await handleOrganizationCreated(evt.data);
      break;
    // Add other cases here...
    default:
      console.log(`Unhandled event type: ${evt.type}`);
  }

  console.log(`Webhook with an ID of ${evt.data.id} and type of ${evt.type}`)
  console.log('Webhook body:', body)

  return new Response('Webhook processed successfully', { status: 200 })
}

export async function GET(req: Request) {
  return new Response('This endpoint only accepts POST requests', { status: 405 });
}