import { NextResponse } from 'next/server';
import { withAxiom } from 'next-axiom';
import cors from '#helpers/cors';
import { getSessionData } from '#helpers/tokens';
import { sendTwilioVerificationCode } from '#helpers/twilioHelpers';

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
  const verification = await sendTwilioVerificationCode(
    issuer,
    email ? 'email' : 'sms',
    locale,
  );

  if (verification && verification.status === 'canceled') {
    return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
  }

  return NextResponse.json({
    issuer,
  });
};

export const { POST, OPTIONS } = cors({
  POST: withAxiom(requestUpdateContact),
});
