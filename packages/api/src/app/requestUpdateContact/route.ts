import { NextResponse } from 'next/server';
import {
  sendTwilioVerificationCode,
  handleTwilioError,
} from '@azzapp/service/twilioHelpers';
import ERRORS from '@azzapp/shared/errors';
import cors from '#helpers/cors';
import { withPluginsRoute } from '#helpers/queries';
import { getSessionData } from '#helpers/tokens';
import type { FetchError } from '@azzapp/shared/networkHelpers';

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
  try {
    const verification = await sendTwilioVerificationCode(
      issuer,
      email ? 'email' : 'sms',
      locale,
    );

    if (verification && verification.status === 'canceled') {
      return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
    }
  } catch (error) {
    if (handleTwilioError(error as FetchError) === 'invalid_recipient') {
      return NextResponse.json(
        {
          message: email
            ? ERRORS.EMAIL_NOT_VALID
            : ERRORS.PHONENUMBER_NOT_VALID,
        },
        { status: 400 },
      );
    }
  }

  return NextResponse.json({
    issuer,
  });
};

export const { POST, OPTIONS } = cors({
  POST: withPluginsRoute(requestUpdateContact),
});
