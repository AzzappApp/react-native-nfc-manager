import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { getUserById } from '@azzapp/data/domains';
import ERRORS from '@azzapp/shared/errors';
import cors from '#helpers/cors';
import { getSessionData } from '#helpers/tokens';

async function revalidate(req: Request) {
  const session = await getSessionData();

  if (!session) {
    return NextResponse.json({ error: ERRORS.UNAUTHORIZED }, { status: 401 });
  }

  const user = await getUserById(session?.userId);

  if (!user) {
    return NextResponse.json({ error: ERRORS.UNAUTHORIZED }, { status: 401 });
  }

  if (!user.roles?.includes('admin')) {
    return NextResponse.json({ error: ERRORS.FORBIDDEN }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const path = searchParams.get('path');
  const layout =
    (searchParams.get('layout') as 'layout' | 'page' | null) ?? undefined;

  if (!path || (layout && !['page', 'layout'].includes(layout))) {
    return NextResponse.json(
      { error: ERRORS.INVALID_REQUEST },
      { status: 400 },
    );
  }

  revalidatePath(path, layout);

  return NextResponse.json({
    path,
    layout,
  });
}

export const { POST, OPTIONS } = cors({ POST: revalidate });
