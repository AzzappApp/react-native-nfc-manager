import { NextResponse } from 'next/server';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@azzapp/i18n';
import type { NextRequest } from 'next/server';

const PUBLIC_FILE = /\.(.*)$/;
export function middleware(request: NextRequest) {
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

  if (PUBLIC_FILE.test(nextUrl.pathname) || nextUrl.pathname.includes('/api')) {
    return undefined;
  }

  const url = nextUrl.clone();

  url.pathname = `/${locale}${nextUrl.pathname}`;

  return NextResponse.rewrite(url);
}
