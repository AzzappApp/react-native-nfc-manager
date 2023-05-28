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

export const runtime = 'edge';
