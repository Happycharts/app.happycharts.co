import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { clerkClient, auth } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  '/auth',
  '/auth/(.*)',
  '/pricing',
  '/privacy',
  '/portal/(.*)',
  '/terms',
  '/api/(.*)',
  '/api/webhooks(.*)'
]);

const allowedRoutes = [
  '/home',
  '/users',
  '/query',
  '/auth',
  '/api/(.*)',
  '/api/apps',
  '/api/connect_links',
  '/api/products',
  '/api/portals/create',
  '/api/webhooks/stripe',
  '/api/connect_links/generate',
  '/portals',
  '/api/webhooks(.*)',
  '/billing',
  '/portal',
  '/apps',
  '/terms',
  '/privacy',
];

const allowedOrigins = [
  'http://localhost:3000',
  'https://wa.me/18657763192',
  'https://app.happybase.co',
  'https://connect.stripe.com',
  'https://www.happybase.co',
  'https://buy.stripe.com'
];

function corsMiddleware(request: NextRequest, response: NextResponse) {
  const origin = request.headers.get('origin') ?? '';

  if (allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Client-Info, ApiKey');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: response.headers });
  }

  return response;
}

export default clerkMiddleware(async (auth, req) => {
  const nextRequest = req as NextRequest;
  const { pathname } = nextRequest.nextUrl;
  const isAllowedRoute = allowedRoutes.some(route => pathname.startsWith(route));

  console.log(`Request to ${pathname} - isAllowedRoute: ${isAllowedRoute}`);

  // Explicitly allow webhook routes
  if (pathname.startsWith('/api/webhooks')) {
    console.log(`Allowing webhook request to ${pathname}`);
    return NextResponse.next();
  }

  if (!isAllowedRoute) {
    console.log(`Redirecting to /home because ${pathname} is not an allowed route`);
    return NextResponse.redirect(new URL('/home', nextRequest.url));
  }

  if (!isPublicRoute(req)) {
    const { userId, orgId } = auth();

    if (!userId) {
      console.log(`Redirecting to /auth/login because user is not authenticated`);
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    if (!orgId) {
      console.log(`Redirecting to /auth/create-organization because no orgId found`);
      return NextResponse.redirect(new URL('/auth/create-organization', req.url));
    }

    if (userId && orgId) {
      console.log(`Redirecting to /home because user is authenticated and has an orgId`);
      return NextResponse.redirect(new URL('/home', req.url));
    }

    try {
      const organization = await clerkClient().organizations.getOrganization({ organizationId: orgId });
      const publicMetadata = organization.publicMetadata as { status?: string };
      
      if (publicMetadata.status === "suspended") {
        console.log(`Redirecting to /suspended because organization is suspended`);
        return NextResponse.redirect(new URL('/suspended', req.url));
      }
    } catch (error) {
      console.log(`Redirecting to /auth/create-organization because organization is not found`);
      return NextResponse.redirect(new URL('/auth/create-organization', req.url));
    }
  }

  const response = NextResponse.next();
  return corsMiddleware(nextRequest, response);
});

export const config = {
  matcher: ['/((?!.*\\..*|_next|api/webhooks).*)', '/', '/(api|trpc)(.*)'],
};