import * as Sentry from '@sentry/nextjs';
import * as bcrypt from 'bcrypt-ts';
import { NextResponse } from 'next/server';
import {
  createUser,
  getProfilesOfUser,
  getUserByEmail,
  getUserByPhoneNumber,
  updateUser,
} from '@azzapp/data/domains';
import ERRORS from '@azzapp/shared/errors';
import {
  formatPhoneNumber,
  isInternationalPhoneNumber,
  isValidEmail,
} from '@azzapp/shared/stringHelpers';
import { handleSignInAuthMethod } from '#helpers/auth';
import { twilioVerificationService } from '#helpers/twilioHelpers';
import type { User } from '@azzapp/data/domains';

type SignupBody = {
  email?: string | null;
  phoneNumber?: string | null;
  password?: string;
  locale?: string;
};

const handleExistingUser = async (user: User, password: string) => {
  //try to login the user
  try {
    //TODO: review Security: Use a constant-time compairson function like crypto.timingSafeEqual()
    // instead of bcrypt.compareSync() to compare passwords. This helps prevent timing attacks.
    if (user?.password && bcrypt.compareSync(password, user.password)) {
      // we can log the user
      const profiles = await getProfilesOfUser(user.id, 1);
      return await handleSignInAuthMethod(user, profiles.shift()?.Profile);
    } else if (user.invited) {
      await updateUser(user.id, {
        password: bcrypt.hashSync(password, 12),
        roles: null,
      });

      const profiles = await getProfilesOfUser(user.id, 1);
      return await handleSignInAuthMethod(user, profiles.shift()?.Profile);
    }
  } catch (error) {
    return NextResponse.json(
      { message: ERRORS.EMAIL_ALREADY_EXISTS },
      { status: 400 },
    );
  }
  return NextResponse.json(
    { message: ERRORS.EMAIL_ALREADY_EXISTS },
    { status: 400 },
  );
};

export const POST = async (req: Request) => {
  const { email, phoneNumber, password, locale } =
    ((await req.json()) as SignupBody) || {};

  //we need at least one email or one phone number
  if ((!email && !phoneNumber) || !password) {
    return NextResponse.json(
      { message: ERRORS.INVALID_REQUEST },
      { status: 400 },
    );
  }

  try {
    if (email != null) {
      if (!isValidEmail(email)) {
        return NextResponse.json(
          { message: ERRORS.EMAIL_NOT_VALID },
          { status: 400 },
        );
      }
      const user = await getUserByEmail(email);
      if (user != null) {
        return handleExistingUser(user, password);
      }
    }

    if (isInternationalPhoneNumber(phoneNumber)) {
      const user = await getUserByPhoneNumber(formatPhoneNumber(phoneNumber!));
      if (user != null) {
        return handleExistingUser(user, password);
      }
    }
    const userPhoneNumber = phoneNumber?.replace(/\s/g, '') ?? null;
    await createUser({
      email: email ?? null,
      phoneNumber: userPhoneNumber,
      password: bcrypt.hashSync(password, 12),
      locale: locale ?? null,
      roles: null,
    });

    const issuer = (email ?? userPhoneNumber) as string;
    const verification = await twilioVerificationService().verifications.create(
      {
        to: issuer,
        channel: email ? 'email' : 'sms',
        locale,
      },
    );

    if (verification && verification.status === 'canceled') {
      throw new Error('Verification canceled');
    }

    return NextResponse.json({
      issuer,
    });
  } catch (error) {
    console.error(error);
    Sentry.captureException(error);
    return NextResponse.json(
      { message: ERRORS.INTERNAL_SERVER_ERROR },
      { status: 500 },
    );
  }
};

export const runtime = 'nodejs';
