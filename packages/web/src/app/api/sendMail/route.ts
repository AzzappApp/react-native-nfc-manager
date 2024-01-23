import sgMail from '@sendgrid/mail';
import { NextResponse } from 'next/server';
import * as z from 'zod';
import ERRORS from '@azzapp/shared/errors';
import { checkServerAuth } from '#helpers/tokens';

const SendEmailSchema = z.object({
  email: z.string().email(),
  subject: z.string(),
  text: z.string(),
  html: z.string(),
});

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const SENDGRIP_NOREPLY_SENDER = process.env.SENDGRIP_NOREPLY_SENDER!;

export const POST = async (req: Request) => {
  try {
    checkServerAuth();
    const body = await req.json();
    const input = SendEmailSchema.parse(body);

    const { email, subject, text, html } = input;

    const msg = {
      to: email,
      from: SENDGRIP_NOREPLY_SENDER, // Change to your verified sender
      subject,
      text,
      html,
    };

    await sgMail.send(msg);

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
};

export const runtime = 'nodejs';
