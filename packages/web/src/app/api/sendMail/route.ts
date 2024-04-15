import { NextResponse } from 'next/server';
import { withAxiom } from 'next-axiom';
import * as z from 'zod';
import ERRORS from '@azzapp/shared/errors';
import { sendEmail } from '#helpers/contactHelpers';
import { checkServerAuth } from '#helpers/tokens';

const SendEmailSchema = z
  .object({
    email: z.string().email(),
    subject: z.string(),
    text: z.string(),
    html: z.string(),
  })
  .array()
  .nonempty();

export const POST = withAxiom(async (req: Request) => {
  try {
    checkServerAuth();
    const body = await req.json();
    const input = SendEmailSchema.parse(body);

    await sendEmail(
      input.map(msg => ({
        email: msg.email,
        subject: msg.subject,
        text: msg.text,
        html: msg.html,
      })),
    );

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
