import { NextResponse } from 'next/server';
import cors from '#helpers/cors';
import { getSessionData } from '#helpers/tokens';
import { twilioVerificationService } from '#helpers/twilioHelpers';

type RequestUpdateContact = {
  email?: string | null;
  phoneNumber?: string | null;
  locale?: string;
};

const requestUpdateContact = async (req: Request) => {
  const { email, phoneNumber, locale } =
    ((await req.json()) as RequestUpdateContact) || {};

  const { userId } = (await getSessionData()) ?? {};
  if (!userId) {
    return new Response('Invalid request', { status: 400 });
  }

  const issuer = (email ?? phoneNumber) as string;
  const verification = await twilioVerificationService().verifications.create({
    to: issuer,
    channel: email ? 'email' : 'sms',
    locale,
  });

  if (verification && verification.status === 'canceled') {
    throw new Error('Verification canceled');
  }

  return NextResponse.json({
    issuer,
  });
};

export const { POST, OPTIONS } = cors({ POST: requestUpdateContact });

export const runtime = 'nodejs';
