import { NextResponse } from 'next/server';
import { destroySession } from '#helpers/session';
import type { NextRequest } from 'next/server';

export const GET = async (req: NextRequest) =>
  destroySession(NextResponse.redirect(req.url.replace('/logout', '/login')));
