import * as Sentry from '@sentry/nextjs';
import * as bcrypt from 'bcrypt-ts';
import { NextResponse } from 'next/server';
import { withAxiom } from 'next-axiom';
import { updateUser, getUserByPhoneNumber, getUserByEmail } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { isValidEmail } from '@azzapp/shared/stringHelpers';
import { checkTwilioVerificationCode } from '#helpers/twilioHelpers';

type ChangePasswordBody = {
  password: string;
  token: string;
  issuer: string;
};

export const POST = withAxiom(async (req: Request) => {
  const { password, token, issuer } = (await req.json()) as ChangePasswordBody;
  if (!password || !token) {
    return NextResponse.json(
      { message: ERRORS.INVALID_REQUEST },
      { status: 400 },
    );
  }

  try {
    const verificationCheck = await checkTwilioVerificationCode(issuer, token);
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
      await updateUser(user.id, {
        password: bcrypt.hashSync(password, 12),
      });
      return NextResponse.json({ ok: true });
    } else {
      return NextResponse.json(
        { message: ERRORS.INVALID_REQUEST },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error(error);
    Sentry.captureException(error);
    return NextResponse.json(
      { message: ERRORS.INTERNAL_SERVER_ERROR },
      { status: 500 },
    );
  }
});
