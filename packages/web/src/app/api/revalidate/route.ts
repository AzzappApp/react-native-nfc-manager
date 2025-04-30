import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import * as z from 'zod';
import { checkServerAuth } from '@azzapp/service/serverAuthServices';
import ERRORS from '@azzapp/shared/errors';

const RevalidateSchema = z.object({
  cards: z.array(z.string()).nullable(),
  posts: z.array(z.object({ userName: z.string(), id: z.string() })).nullable(),
});

export const POST = async (req: Request) => {
  try {
    await checkServerAuth(await headers());
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
};

export const runtime = 'nodejs';
