import { NextResponse } from 'next/server';
import { getRedirectWebCardByUserName } from '@azzapp/data';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { nextUrl } = request;

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
