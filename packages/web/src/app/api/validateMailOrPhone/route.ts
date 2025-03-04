import { NextResponse } from 'next/server';
import * as z from 'zod';
import ERRORS from '@azzapp/shared/errors';
import { withPluginsRoute } from '#helpers/queries';
import { checkServerAuth } from '#helpers/tokens';
import { checkTwilioVerificationCode } from '#helpers/twilioHelpers';

const ValidateSchema = z.union([
  z.object({
    type: z.literal('email'),
    issuer: z.string().email(),
    token: z.string(),
  }),
  z.object({
    type: z.literal('phone'),
    issuer: z.string(),
    token: z.string(),
  }),
]);

export const POST = withPluginsRoute(async (req: Request) => {
  try {
    await checkServerAuth();
    const body = await req.json();
    const input = ValidateSchema.parse(body);

    const result = await checkTwilioVerificationCode(input.issuer, input.token);

    if (result.status === 'approved') {
      return NextResponse.json(
        {
          message: 'sent',
        },
        {
          status: 200,
        },
      );
    } else {
      return NextResponse.json(
        {
          message: 'invalid',
        },
        {
          status: 400,
        },
      );
    }
  } catch (e) {
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
