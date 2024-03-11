import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';
import {
  getUserByEmail,
  getUserByPhoneNumber,
  updateUser,
} from '@azzapp/data/domains';
import ERRORS from '@azzapp/shared/errors';
import { isValidEmail } from '@azzapp/shared/stringHelpers';
import { generateTokens } from '#helpers/tokens';
import { twilioVerificationService } from '#helpers/twilioHelpers';

type ConfirmRegistrationBody = {
  token?: string;
  issuer?: string;
};

export const POST = async (req: Request) => {
  const { token, issuer } = (await req.json()) as ConfirmRegistrationBody;

  if (!token || !issuer) {
    return NextResponse.json(
      { message: ERRORS.INVALID_REQUEST },
      { status: 400 },
    );
  }

  const isEmail = isValidEmail(issuer);

  try {
    const user = isEmail
      ? await getUserByEmail(issuer)
      : await getUserByPhoneNumber(issuer);

    if (user) {
      const verificationCheck =
        await twilioVerificationService().verificationChecks.create({
          to: issuer,
          code: token,
        });

      if (verificationCheck.status !== 'approved') {
        return NextResponse.json(
          { message: ERRORS.INVALID_REQUEST },
          { status: 400 },
        );
      }

      await updateUser(user.id, {
        [isEmail ? 'emailConfirmed' : 'phoneNumberConfirmed']: true,
      });

      const tokens = await generateTokens({
        userId: user.id,
      });

      return NextResponse.json({
        ok: true,
        token: tokens.token,
        refreshToken: tokens.refreshToken,
        email: user.email ?? null,
        phoneNumber: user.phoneNumber,
        userId: user.id,
      });
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
