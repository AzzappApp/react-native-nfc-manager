import { NextResponse } from 'next/server';
import { withAxiom } from 'next-axiom';
import * as z from 'zod';
import {
  getLocalizationMessagesByTarget,
  saveLocalizationMessage,
} from '@azzapp/data';
import { SUPPORTED_LOCALES, ENTITY_TARGET } from '@azzapp/i18n';
import ERRORS from '@azzapp/shared/errors';
import { checkServerAuth } from '#helpers/tokens';

export const GET = withAxiom(
  async (
    req: Request,
    {
      params,
    }: {
      params: { target: string };
    },
  ) => {
    if (params.target !== ENTITY_TARGET) {
      return NextResponse.json({ message: 'Invalid target' }, { status: 400 });
    }
    try {
      checkServerAuth();
    } catch (e) {
      if ((e as Error).message === ERRORS.INVALID_TOKEN) {
        return NextResponse.json(
          { message: ERRORS.INVALID_TOKEN },
          { status: 401 },
        );
      }
      throw e;
    }
    const messages = await getLocalizationMessagesByTarget(params.target);
    return NextResponse.json(messages);
  },
);

const updateMessageSchema = z.object({
  key: z.string().min(1),
  //@ts-expect-error SUPPORTED_LOCALES is not empty
  locale: z.enum(SUPPORTED_LOCALES),
  value: z.string(),
});

export const POST = withAxiom(
  async (
    req: Request,
    {
      params,
    }: {
      params: { target: string };
    },
  ) => {
    if (params.target !== ENTITY_TARGET) {
      return NextResponse.json({ message: 'Invalid target' }, { status: 400 });
    }
    try {
      checkServerAuth();
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
      target: ENTITY_TARGET,
      value,
    });

    return NextResponse.json({ message: 'ok' });
  },
);
