import { NextResponse } from 'next/server';
import { withAxiom } from 'next-axiom';
import * as z from 'zod';
import ERRORS from '@azzapp/shared/errors';
import { checkServerAuth } from '#helpers/tokens';
import {
  TWILIO_PHONE_NUMBER,
  twilioMessagesService,
} from '#helpers/twilioHelpers';

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

    await twilioMessagesService().create({
      body,
      to: phoneNumber,
      from: TWILIO_PHONE_NUMBER,
    });

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
