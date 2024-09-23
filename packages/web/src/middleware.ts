import { MultiRegionRatelimit, Ratelimit } from '@upstash/ratelimit';
import { waitUntil } from '@vercel/functions';
import { createClient, kv } from '@vercel/kv';
import { NextResponse } from 'next/server';
import { getRedirectWebCardByUserName } from '@azzapp/data';
import type { NextRequest } from 'next/server';

const cache = new Map();

const redisClient =
  process.env.NEXT_PUBLIC_PLATFORM === 'production'
    ? [
        createClient({
          url: process.env.KV_PROD_FRA1_REST_API_URL ?? '',
          token: process.env.KV_PROD_FRA1_REST_API_TOKEN ?? '',
        }),
        createClient({
          url: process.env.KV_PROD_PDX1_REST_API_URL ?? '',
          token: process.env.KV_PROD_PDX1_REST_API_TOKEN ?? '',
        }),
        createClient({
          url: process.env.KV_PROD_IAD1_REST_API_URL ?? '',
          token: process.env.KV_PROD_IAD1_REST_API_TOKEN ?? '',
        }),
        createClient({
          url: process.env.KV_PROD_GRU1_REST_API_URL ?? '',
          token: process.env.KV_PROD_GRU1_REST_API_TOKEN ?? '',
        }),
        createClient({
          url: process.env.KV_PROD_SIN1_REST_API_URL ?? '',
          token: process.env.KV_PROD_SIN1_REST_API_TOKEN ?? '',
        }),
      ]
    : kv;

const rateLimit = {
  api: Array.isArray(redisClient)
    ? new MultiRegionRatelimit({
        redis: redisClient,
        limiter: MultiRegionRatelimit.slidingWindow(25, '1 s'),
        ephemeralCache: cache,
      })
    : new Ratelimit({
        redis: redisClient,
        limiter: Ratelimit.slidingWindow(25, '1 s'),
        ephemeralCache: cache,
      }),
  web: Array.isArray(redisClient)
    ? new MultiRegionRatelimit({
        redis: redisClient,
        limiter: MultiRegionRatelimit.slidingWindow(15, '1 s'),
        ephemeralCache: cache,
      })
    : new Ratelimit({
        redis: redisClient,
        limiter: Ratelimit.slidingWindow(15, '1 s'),
        ephemeralCache: cache,
      }),
};

export async function middleware(request: NextRequest) {
  const { nextUrl } = request;

  if (process.env.NODE_ENV === 'production') {
    const ip = request.ip ?? '127.0.0.1';

    const startTime = performance.now();
    const { pending, success } = nextUrl.pathname.startsWith('/api')
      ? await rateLimit.api.limit(ip)
      : await rateLimit.web.limit(ip);

    console.log(
      `Rate limit: ${nextUrl.pathname} ${ip} ${success} ${
        performance.now() - startTime
      }ms`,
    );

    waitUntil(pending);

    if (!success) {
      return NextResponse.json(
        {
          message: 'Too Many Requests',
        },
        {
          status: 429,
        },
      );
    }
  }

  if (nextUrl.pathname.startsWith('/api')) {
    return undefined;
  }

  // Handle redirection at root level but should be the LAST to be handle(performance, handle all other static route like /api before)
  if (nextUrl.pathname?.length > 1) {
    const pathComponents = nextUrl.pathname.substring(1).split('/');
    //we have to check for a redirection
    const startTime = performance.now();
    const redirection = await getRedirectWebCardByUserName(pathComponents[0]);
    console.log(
      `Redirection: ${pathComponents[0]} ${redirection.length} ${
        performance.now() - startTime
      }ms`,
    );

    if (redirection.length > 0) {
      pathComponents[0] = redirection[0].toUserName;
      // Merge pathComponents into a single string with '/' as the separator
      const nextPath = `/${pathComponents.join('/')}${request.nextUrl.search}`;
      return NextResponse.redirect(new URL(nextPath, request.url));
    }
  }

  if (nextUrl.pathname !== nextUrl.pathname.toLowerCase()) {
    const pathComponents = nextUrl.pathname.substring(1).split('/');
    pathComponents[0] = pathComponents[0].toLowerCase(); // Lowercase only the first part
    const nextPath = `/${pathComponents.join('/')}${request.nextUrl.search}`;
    return NextResponse.redirect(new URL(nextPath, request.url));
  }

  return undefined;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_.*|favicon.*|site.*|.well-known).*)',
  ],
};
