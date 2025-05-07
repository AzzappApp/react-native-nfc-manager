import { NextResponse } from 'next/server';
import { getUserById } from '@azzapp/data';
import backOfficeSections from '#backOfficeSections';
import env from '#env';
import { destroySession, getRequestSession } from '#helpers/session';
import type { SubSection } from '#backOfficeSections';
import type { NextURL } from 'next/dist/server/web/next-url';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { nextUrl } = request;
  if (nextUrl.pathname.startsWith('/login')) {
    return NextResponse.next();
  }

  const session = await getRequestSession(request).catch(e => {
    if (
      process.env.NODE_ENV === 'development' ||
      env.NEXT_PUBLIC_PLATFORM === 'development'
    ) {
      console.error(e);
    }
    return null;
  });

  if (!session?.userId) {
    return redirectToLogin(nextUrl);
  }
  const user = await getUserById(session.userId);
  if (!user) {
    return destroySession(redirectToLogin(nextUrl));
  }
  const section = backOfficeSections
    .reduce((acc, section) => {
      if ('subSections' in section) {
        return [...acc, ...section.subSections];
      } else {
        return [...acc, section];
      }
    }, [] as SubSection[])
    .find(section => nextUrl.pathname.startsWith(section.href));

  if (section && !user.roles?.some(role => section.roles.includes(role))) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  return NextResponse.next();
}

const redirectToLogin = (nextUrl: NextURL) => {
  const url = nextUrl.clone();
  url.pathname = `/login`;
  if (nextUrl.pathname !== '/') {
    url.searchParams.set('redirect', encodeURIComponent(nextUrl.pathname));
  }
  return NextResponse.redirect(url);
};

export const config = {
  matcher: '/((?!api|static|.*\\..*|_next|_monitoring).*)',
};
