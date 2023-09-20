import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { getUserById } from '@azzapp/data/domains';
import ERRORS from '@azzapp/shared/errors';
import cors from '#helpers/cors';
import { getSessionData } from '#helpers/tokens';

async function revalidate(req: Request) {
  const session = await getSessionData();

  if (!session) {
    return NextResponse.json({ error: ERRORS.UNAUTORIZED }, { status: 401 });
  }

  const user = await getUserById(session?.userId);

  if (!user) {
    return NextResponse.json({ error: ERRORS.UNAUTORIZED }, { status: 401 });
  }

  if (!user.roles?.includes('admin')) {
    return NextResponse.json({ error: ERRORS.FORBIDDEN }, { status: 403 });
  }

  const tagToRevalidate = new URL(req.url).searchParams.get('tag');

  if (!tagToRevalidate) {
    return NextResponse.json(
      { error: ERRORS.INVALID_REQUEST },
      { status: 400 },
    );
  }

  console.info(`Manualy revalidate tag ${tagToRevalidate}`);
  revalidateTag(tagToRevalidate);

  return NextResponse.json({
    tag: tagToRevalidate,
  });
}

export const { POST, OPTIONS } = cors({ POST: revalidate });
