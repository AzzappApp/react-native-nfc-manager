import { NextResponse } from 'next/server';
import { destroySession, getSession } from '@azzapp/auth/session';

export const POST = async () => {
  const session = await getSession();
  const res = NextResponse.json({ ok: true });
  if (!session?.isAnonymous) {
    return destroySession(res);
  }
  return res;
};

// TODO blocked by https://github.com/vercel/next.js/issues/46337
// export const runtime = 'edge';
