import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';
import { getRedirectWebCardByUserName } from '@azzapp/data/domains';
import type { NextRequest } from 'next/server';

const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

export async function middleware(request: NextRequest) {
  const { nextUrl } = request;

  const ip = request.ip ?? '127.0.0.1';
  const { success } = await ratelimit.limit(ip);

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

  // Handle redirection at root level but should be the LAST to be handle(performance, handle all other static route like /api before)
  if (nextUrl.pathname?.length > 1) {
    const pathComponents = nextUrl.pathname.substring(1).split('/');
    //we have to check for a redirection
    const redirection = await getRedirectWebCardByUserName(pathComponents[0]);

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
    '/((?!api|_.*|favicon.*|site.*|.well-known).*)',
  ],
};
