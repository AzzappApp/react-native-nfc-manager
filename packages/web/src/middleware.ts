import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host');
  const { pathname, searchParams } = request.nextUrl;

  //to test : sudo sh -c 'echo "127.0.0.1 shared.localhost shared-dev.localhost shared-staging.localhost" >> /etc/hosts'
  if (host?.startsWith('shared')) {
    const baseUrl = process.env.NEXT_PUBLIC_URL;
    const newUrl = new URL(pathname, baseUrl);

    // Only rewrite if k parameter is present
    if (searchParams.has('k')) {
      const username = pathname.split('/')[1]; // Get username from path
      const response = NextResponse.rewrite(
        new URL(`/${username}/shared?k=${searchParams.get('k')}`, baseUrl),
      );
      //the adding of x-use-appclip in the header is working  on /${username}/shared but not on /${username}
      response.headers.set('x-use-appclip', '1');
      return response;
    }
    //if no contact data info, redirect to the user page
    return NextResponse.rewrite(newUrl);
  }

  return NextResponse.next();
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
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
