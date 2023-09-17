import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';
import { Twilio } from 'twilio';
import { getUserByEmail, getUserByPhoneNumber } from '@azzapp/data/domains';
import ERRORS from '@azzapp/shared/errors';
import {
  isInternationalPhoneNumber,
  isValidEmail,
} from '@azzapp/shared/stringHelpers';

type ForgotPasswordBody = {
  credential: string;
  locale: string;
};

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID!;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN!;
const TWILIO_ACCOUNT_VERIFY_SERVICE_SID =
  process.env.TWILIO_ACCOUNT_VERIFY_SERVICE_SID!;

export const POST = async (req: Request) => {
  const { credential, locale } = (await req.json()) as ForgotPasswordBody;
  if (!credential) {
    return NextResponse.json(
      { message: ERRORS.INVALID_REQUEST },
      { status: 400 },
    );
  }
  try {
    let user;
    let issuer: string | undefined;
    let channel: 'email' | 'sms' | undefined;

    if (isValidEmail(credential)) {
      user = await getUserByEmail(credential);
      if (user) {
        issuer = user.email!;
        channel = 'email';
      }
    } else if (isInternationalPhoneNumber(credential)) {
      user = await getUserByPhoneNumber(credential);
      if (user) {
        issuer = user.phoneNumber!;
        channel = 'sms';
      }
    }

    if (!issuer || !channel) {
      // even if the user does not exist, we answer with a 200 to avoid leaking information
      return NextResponse.json({ issuer: credential }, { status: 200 });
    }

    const client = new Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    const verification = await client.verify.v2
      .services(TWILIO_ACCOUNT_VERIFY_SERVICE_SID)
      .verifications.create({ to: issuer, channel, locale });

    if (verification && verification.status === 'canceled') {
      throw new Error('Verification canceled');
    }
    return NextResponse.json({ issuer: credential });
  } catch (error) {
    Sentry.captureException(error);
    console.error(error);
    return NextResponse.json(
      { message: ERRORS.INTERNAL_SERVER_ERROR },
      { status: 500 },
    );
  }
};

export const runtime = 'nodejs';
