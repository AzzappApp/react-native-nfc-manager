import { NextResponse } from 'next/server';
import { withAxiom } from 'next-axiom';
import * as z from 'zod';
import ERRORS from '@azzapp/shared/errors';
import { checkServerAuth } from '#helpers/tokens';
import { twilioVerificationService } from '#helpers/twilioHelpers';

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

export const POST = withAxiom(async (req: Request) => {
  try {
    checkServerAuth();
    const body = await req.json();
    const input = ValidateSchema.parse(body);

    const result = await twilioVerificationService().verificationChecks.create({
      to: input.issuer,
      code: input.token,
    });

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

export const runtime = 'nodejs';
