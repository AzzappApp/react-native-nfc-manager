import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Check if the URL matches the pattern /[userName] with c or k parameter
  const pathParts = pathname.split('/').filter(Boolean);
  if (
    pathParts.length === 1 &&
    (searchParams.has('c') || searchParams.has('k'))
  ) {
    const userName = pathParts[0];
    const newUrl = new URL(`/share/${userName}`, request.url);

    // Preserve the query parameters
    searchParams.forEach((value, key) => {
      newUrl.searchParams.set(key, value);
    });

    return NextResponse.redirect(newUrl);
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
     * - share (already in correct format)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|share).*)',
  ],
};
