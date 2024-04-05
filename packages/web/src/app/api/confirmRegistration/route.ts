import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';
import { withAxiom } from 'next-axiom';
import {
  getProfilesOfUser,
  getUserByEmail,
  getUserByPhoneNumber,
  updateUser,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { isValidEmail } from '@azzapp/shared/stringHelpers';
import { handleSignInAuthMethod } from '#helpers/auth';
import { twilioVerificationService } from '#helpers/twilioHelpers';

type ConfirmRegistrationBody = {
  token?: string;
  issuer?: string;
};

export const POST = withAxiom(async (req: Request) => {
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

      const update = {
        [isEmail ? 'emailConfirmed' : 'phoneNumberConfirmed']: true,
      };

      await updateUser(user.id, update);

      // if we found a user by email or phonenumber, we look for the profile
      const profiles = await getProfilesOfUser(user.id, 1);
      const profile = profiles[0]?.Profile;

      return handleSignInAuthMethod({ ...user, ...update }, profile);
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
});

export const runtime = 'nodejs';
