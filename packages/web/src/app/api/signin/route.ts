import * as bcrypt from 'bcrypt-ts';
import { NextResponse } from 'next/server';
import { destroySession, setSession } from '@azzapp/auth/session';
import { generateTokens } from '@azzapp/auth/tokens';
import {
  getProfileByUserName,
  getUserByEmail,
  getUserByPhoneNumber,
  getUserProfiles,
  getUsersByIds,
} from '@azzapp/data/domains';
import ERRORS from '@azzapp/shared/errors';
import {
  isInternationalPhoneNumber,
  isValidEmail,
} from '@azzapp/shared/stringHelpers';
import cors from '#helpers/cors';
import type { Profile, User } from '@azzapp/data/domains';

type SignInBody = {
  credential?: string; //email or username or phone number
  password?: string;
  authMethod?: 'cookie' | 'token';
};

const signin = async (req: Request) => {
  const bod = await req.json();
  const { credential, password, authMethod } = <SignInBody>bod || {};

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
      user = await getUserByPhoneNumber(credential.replace(/\s/g, ''));
    }
    if (user) {
      // if we found a user by email or phonenumber, we look for the profile
      [profile] = await getUserProfiles(user.id);
    } else {
      // in all other case, look for username
      profile = await getProfileByUserName(credential);
      [user] = profile ? await getUsersByIds([profile.userId]) : [];
    }

    if (!user?.password) {
      return NextResponse.json(
        { message: ERRORS.INVALID_CREDENTIALS },
        { status: 401 },
      );
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return NextResponse.json(
        { message: ERRORS.INVALID_CREDENTIALS },
        { status: 401 },
      );
    }

    if (authMethod === 'token') {
      const { token, refreshToken } = await generateTokens({
        userId: user.id,
        profileId: profile?.id,
      });
      return destroySession(
        NextResponse.json({
          ok: true,
          profileId: profile?.id,
          token,
          refreshToken,
        }),
      );
    } else {
      return setSession(NextResponse.json({ profileId: profile?.id }), {
        userId: user.id,
        profileId: profile?.id,
        isAnonymous: false,
      });
    }
  } catch (error) {
    console.error('Singin error');
    console.error(typeof error);
    console.error(error);
    return NextResponse.json(
      { message: ERRORS.INTERNAL_SERVER_ERROR },
      { status: 500 },
    );
  }
};

export const { POST, OPTIONS } = cors({ POST: signin });

// TODO blocked by https://github.com/vercel/next.js/issues/46337
// export const runtime = 'edge';
