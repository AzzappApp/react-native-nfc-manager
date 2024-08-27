import * as Sentry from '@sentry/nextjs';
import * as bcrypt from 'bcrypt-ts';
import { NextResponse } from 'next/server';
import { withAxiom } from 'next-axiom';
import {
  getUserByEmail,
  getUserByPhoneNumber,
  getUserById,
  getProfilesByUser,
  getOwnerProfileByUserName,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import {
  formatPhoneNumber,
  isInternationalPhoneNumber,
  isValidEmail,
} from '@azzapp/shared/stringHelpers';
import { handleSignInAuthMethod } from '#helpers/auth';
import cors from '#helpers/cors';
import type { Profile, User } from '@azzapp/data';

type SignInBody = {
  credential?: string; //email or username or phone number
  password?: string;
  authMethod?: 'cookie' | 'token';
};

const signin = async (req: Request) => {
  const bod = await req.json();
  const { credential, password } = <SignInBody>bod || {};

  if (!credential || !password) {
    return NextResponse.json(
      { message: ERRORS.INVALID_REQUEST },
      { status: 400 },
    );
  }
  try {
    let user: User | null = null;
    let profile: Profile | null = null;
    if (isValidEmail(credential)) {
      // looking for email only if the credential is a valid email
      user = await getUserByEmail(credential);
    }
    if (!user && isInternationalPhoneNumber(credential)) {
      // looking for phonenumber only if the credential is a valid phonenumber
      user = await getUserByPhoneNumber(formatPhoneNumber(credential));
    }
    if (user) {
      // if we found a user by email or phonenumber, we look for the profile
      const profiles = await getProfilesByUser(user.id);
      profile = profiles[0];
    } else {
      // in all other case, look for username
      profile = await getOwnerProfileByUserName(credential);
      user = profile ? await getUserById(profile.userId) : null;
    }

    if (!user?.password) {
      return NextResponse.json(
        { message: ERRORS.INVALID_CREDENTIALS },
        { status: 401 },
      );
    }

    //TODO: review Security: Use a constant-time compairson function like crypto.timingSafeEqual()
    // instead of bcrypt.compareSync() to compare passwords. This helps prevent timing attacks.
    if (!bcrypt.compareSync(password, user.password)) {
      return NextResponse.json(
        { message: ERRORS.INVALID_CREDENTIALS },
        { status: 401 },
      );
    }
    return await handleSignInAuthMethod(user, profile);
  } catch (error) {
    console.error(error);
    Sentry.captureException(error);
    return NextResponse.json(
      { message: ERRORS.INTERNAL_SERVER_ERROR },
      { status: 500 },
    );
  }
};

export const { POST, OPTIONS } = cors({ POST: withAxiom(signin) });
