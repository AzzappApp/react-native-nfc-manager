import * as bcrypt from 'bcrypt-ts';
import { NextResponse } from 'next/server';
import {
  createProfile,
  createUser,
  getProfileByUserName,
  getUserByEmail,
  getUserByPhoneNumber,
} from '@azzapp/data/domains';
import ERRORS from '@azzapp/shared/errors';
import {
  isInternationalPhoneNumber,
  isValidEmail,
} from '@azzapp/shared/stringHelpers';
import { destroySession, setSession } from '#helpers/sessionHelpers';
import { generateTokens } from '#helpers/tokensHelpers';

type SignupBody = {
  userName?: string;
  email?: string | null;
  phoneNumber?: string | null;
  password?: string;
  locale?: string;
  firstName?: string;
  lastName?: string;
  authMethod?: 'cookie' | 'token';
};

export const POST = async (req: Request) => {
  const { email, userName, phoneNumber, password, authMethod } =
    ((await req.json()) as SignupBody) || {};

  //we need at least one email or one phone number
  if ((!email && !phoneNumber) || !userName || !password) {
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
      if (await getUserByEmail(email)) {
        return NextResponse.json(
          { message: ERRORS.EMAIL_ALREADY_EXISTS },
          { status: 400 },
        );
      }
    }

    if (isInternationalPhoneNumber(phoneNumber)) {
      if (await getUserByPhoneNumber(phoneNumber!)) {
        return NextResponse.json(
          { message: ERRORS.PHONENUMBER_ALREADY_EXISTS },
          { status: 400 },
        );
      }
    }
    if (await getProfileByUserName(userName)) {
      return NextResponse.json(
        { message: ERRORS.USERNAME_ALREADY_EXISTS },
        { status: 400 },
      );
    }

    const user = await createUser({
      email: email ?? null,
      phoneNumber: phoneNumber ?? null,
      password: bcrypt.hashSync(password, 12),
    });

    const profile = await createProfile({
      userId: user.id,
      userName,
      firstName: null,
      lastName: null,
      companyActivityId: null,
      companyName: null,
      profileKind: null,
      isReady: false,
      colorPalette: [
        '#FFFFFF',
        '#000000',
        '#68C4C9',
        '#EBCC60',
        '#F3A1B0',
        '#B0C0F8',
        '#C8F491',
      ].join(','),
      //TODO: define the default color palette or import the one from the template when card is created from a template
    });

    if (authMethod === 'token') {
      const { token, refreshToken } = await generateTokens({
        userId: user.id,
        profileId: profile.id,
      });
      return destroySession(
        NextResponse.json({ ok: true, token, refreshToken }),
      );
    } else {
      return setSession(NextResponse.json({ ok: true }), {
        userId: user.id,
        profileId: profile.id,
        isAnonymous: false,
      });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: ERRORS.INTERNAL_SERVER_ERROR },
      { status: 500 },
    );
  }
};

// TODO blocked by https://github.com/vercel/next.js/issues/46337
// export const runtime = 'edge';
