import * as Sentry from '@sentry/nextjs';
import { bcrypt } from 'hash-wasm';
import { NextResponse } from 'next/server';
import { Twilio } from 'twilio';
import {
  updateUser,
  getUserByPhoneNumber,
  getUserByEmail,
} from '@azzapp/data/domains';
import { getCrypto } from '@azzapp/shared/crypto';
import ERRORS from '@azzapp/shared/errors';
import { isValidEmail } from '@azzapp/shared/stringHelpers';

type ChangePasswordBody = {
  password: string;
  token: string;
  issuer: string;
};
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID!;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN!;
const TWILIO_ACCOUNT_VERIFY_SERVICE_SID =
  process.env.TWILIO_ACCOUNT_VERIFY_SERVICE_SID!;

export const POST = async (req: Request) => {
  const { password, token, issuer } = (await req.json()) as ChangePasswordBody;
  if (!password || !token) {
    return NextResponse.json(
      { message: ERRORS.INVALID_REQUEST },
      { status: 400 },
    );
  }

  try {
    const client = new Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    const verificationCheck = await client.verify.v2
      .services(TWILIO_ACCOUNT_VERIFY_SERVICE_SID)
      .verificationChecks.create({ to: issuer, code: token });

    if (verificationCheck.status !== 'approved') {
      return NextResponse.json(
        { message: ERRORS.INVALID_REQUEST },
        { status: 400 },
      );
    }

    const user = isValidEmail(issuer)
      ? await getUserByEmail(issuer)
      : await getUserByPhoneNumber(issuer);

    if (user) {
      const salt = new Uint8Array(16);
      getCrypto().getRandomValues(salt);
      await updateUser(user.id, {
        password: await bcrypt({
          password,
          salt,
          costFactor: 12,
        }),
      });
      return NextResponse.json({ ok: true });
    }
  } catch (error) {
    console.error(error);
    Sentry.captureException(error);
    return NextResponse.json(
      { message: ERRORS.INTERNAL_SERVER_ERROR },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { message: ERRORS.INVALID_REQUEST },
    { status: 400 },
  );
};

export const runtime = 'nodejs';
