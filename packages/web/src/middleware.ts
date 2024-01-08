import { NextResponse } from 'next/server';
import { getRedirectWebCardByUserName } from '@azzapp/data/domains';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@azzapp/i18n';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { nextUrl, headers } = request;
  let locale =
    headers
      .get('accept-language')
      ?.split(',')?.[0]
      .split('-')?.[0]
      .toLowerCase() ?? DEFAULT_LOCALE;

  if (!SUPPORTED_LOCALES.includes(locale)) {
    locale = DEFAULT_LOCALE;
  }

  const url = nextUrl.clone();

  // Handle redirection at root level but should be the LAST to be handle(performance, handle all other static route like /api before)
  if (nextUrl.pathname?.length > 1) {
    const pathComponents = nextUrl.pathname.substring(1).split('/');
    //we have to check for a redirectiona1
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
  url.pathname = `/${locale}${nextUrl.pathname.toLowerCase()}`;
  return NextResponse.rewrite(url);
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
    '/((?!api|_next/static|_next/image|favicon.*|site.*|.well-known).*)',
  ],
};
