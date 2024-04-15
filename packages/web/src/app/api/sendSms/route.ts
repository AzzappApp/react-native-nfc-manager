import { NextResponse } from 'next/server';
import { withAxiom } from 'next-axiom';
import * as z from 'zod';
import ERRORS from '@azzapp/shared/errors';
import { sendSMS } from '#helpers/contactHelpers';
import { checkServerAuth } from '#helpers/tokens';

const SendSMSSchema = z.object({
  phoneNumber: z.string(),
  body: z.string(),
});

export const POST = withAxiom(async (req: Request) => {
  try {
    checkServerAuth();
    const reqBody = await req.json();
    const input = SendSMSSchema.parse(reqBody);

    const { phoneNumber, body } = input;

    await sendSMS([{ phoneNumber, body }]);

    return NextResponse.json(
      {
        message: 'sent',
      },
      {
        status: 200,
      },
    );
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
