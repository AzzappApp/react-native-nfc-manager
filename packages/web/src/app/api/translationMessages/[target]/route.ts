import { NextResponse } from 'next/server';
import * as z from 'zod';
import { getLocalizationMessages, saveLocalizationMessage } from '@azzapp/data';
import { SUPPORTED_LOCALES } from '@azzapp/i18n';
import ERRORS from '@azzapp/shared/errors';
import { withPluginsRoute } from '#helpers/queries';
import { checkServerAuth } from '#helpers/tokens';

export const GET = withPluginsRoute(
  async (
    req: Request,
    {
      params,
    }: {
      params: { target: string };
    },
  ) => {
    if (params.target !== 'entity') {
      return NextResponse.json({ message: 'Invalid target' }, { status: 400 });
    }
    try {
      await checkServerAuth();
    } catch (e) {
      if ((e as Error).message === ERRORS.INVALID_TOKEN) {
        return NextResponse.json(
          { message: ERRORS.INVALID_TOKEN },
          { status: 401 },
        );
      }
      throw e;
    }
    const messages = await getLocalizationMessages();
    return NextResponse.json(messages);
  },
);

const updateMessageSchema = z.object({
  key: z.string().min(1),
  //@ts-expect-error SUPPORTED_LOCALES is not empty
  locale: z.enum(SUPPORTED_LOCALES),
  value: z.string(),
});

export const POST = withPluginsRoute(
  async (
    req: Request,
    {
      params,
    }: {
      params: { target: string };
    },
  ) => {
    if (params.target !== 'entity') {
      return NextResponse.json({ message: 'Invalid target' }, { status: 400 });
    }
    try {
      await checkServerAuth();
    } catch (e) {
      if ((e as Error).message === ERRORS.INVALID_TOKEN) {
        return NextResponse.json(
          { message: ERRORS.INVALID_TOKEN },
          { status: 401 },
        );
      }
      throw e;
    }
    const body = (await req.json()) || {};

    const result = updateMessageSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { message: ERRORS.INVALID_REQUEST },
        { status: 400 },
      );
    }
    const { key, locale, value } = result.data;
    await saveLocalizationMessage({
      key,
      locale,
      value,
    });

    return NextResponse.json({ message: 'ok' });
  },
);

export const runtime = 'nodejs';
