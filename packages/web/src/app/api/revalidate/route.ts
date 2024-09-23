import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import * as z from 'zod';
import ERRORS from '@azzapp/shared/errors';
import { withPluginsRoute } from '#helpers/queries';
import { checkServerAuth } from '#helpers/tokens';

const RevalidateSchema = z.object({
  cards: z.array(z.string()).nullable(),
  posts: z.array(z.object({ userName: z.string(), id: z.string() })).nullable(),
});

export const POST = withPluginsRoute(async (req: Request) => {
  try {
    checkServerAuth();
    const body = await req.json();
    const input = RevalidateSchema.parse(body);

    const { cards, posts } = input;

    cards?.forEach(username => {
      revalidatePath(`/${username}`);
    });

    posts?.forEach(({ userName, id }) => {
      revalidatePath(`/${userName}/${id}`);
    });

    return NextResponse.json({ message: 'ok' }, { status: 200 });
  } catch (e) {
    console.error(e);
    if ((e as Error).message === ERRORS.INVALID_TOKEN) {
      return NextResponse.json(
        { message: ERRORS.INVALID_TOKEN },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { message: ERRORS.INVALID_REQUEST },
      { status: 400 },
    );
  }
});

export const runtime = 'nodejs';
