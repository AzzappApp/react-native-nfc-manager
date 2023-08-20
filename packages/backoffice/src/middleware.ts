import { NextResponse } from 'next/server';
import { getUserById } from '@azzapp/data/domains';
import backOfficeSections from '#backOfficeSections';
import { destroySession, getRequestSession } from '#helpers/session';
import type { NextURL } from 'next/dist/server/web/next-url';
import type { NextRequest } from 'next/server';

const PUBLIC_FILE = /\.(.*)$/;
export async function middleware(request: NextRequest) {
  const { nextUrl } = request;
  if (
    PUBLIC_FILE.test(nextUrl.pathname) ||
    nextUrl.pathname.startsWith('/login')
  ) {
    return undefined;
  }

  const session = await getRequestSession(request);

  if (!session?.userId) {
    return redirectToLogin(nextUrl);
  }
  const user = await getUserById(session.userId);
  if (!user) {
    return destroySession(redirectToLogin(nextUrl));
  }
  const section = backOfficeSections.find(section =>
    nextUrl.pathname.startsWith(section.href),
  );
  if (section && !user.roles?.some(role => section.roles.includes(role))) {
    return new NextResponse('Forbidden', { status: 403 });
  }
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
  matcher: ['/((?!_next).*)'],
};
