import * as bcrypt from 'bcrypt-ts';
import { NextResponse } from 'next/server';
import { destroySession, setSession } from '@azzapp/auth/session';
import { generateTokens } from '@azzapp/auth/tokens';
import {
  createUser,
  getUserByEmail,
  getUserByPhoneNumber,
} from '@azzapp/data/domains';
import ERRORS from '@azzapp/shared/errors';
import {
  formatPhoneNumber,
  isInternationalPhoneNumber,
  isValidEmail,
} from '@azzapp/shared/stringHelpers';

type SignupBody = {
  email?: string | null;
  phoneNumber?: string | null;
  password?: string;
  authMethod?: 'cookie' | 'token';
};

export const POST = async (req: Request) => {
  const { email, phoneNumber, password, authMethod } =
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
      if (await getUserByEmail(email)) {
        return NextResponse.json(
          { message: ERRORS.EMAIL_ALREADY_EXISTS },
          { status: 400 },
        );
      }
    }

    if (isInternationalPhoneNumber(phoneNumber)) {
      if (await getUserByPhoneNumber(formatPhoneNumber(phoneNumber!))) {
        return NextResponse.json(
          { message: ERRORS.PHONENUMBER_ALREADY_EXISTS },
          { status: 400 },
        );
      }
    }

    const user = await createUser({
      email: email ?? null,
      phoneNumber: phoneNumber?.replace(/\s/g, '') ?? null,
      password: bcrypt.hashSync(password, 12),
      roles: null,
    });

    if (authMethod === 'token') {
      const { token, refreshToken } = await generateTokens({
        userId: user.id,
        profileId: null,
      });
      return destroySession(
        NextResponse.json({ ok: true, token, refreshToken }),
      );
    } else {
      return setSession(NextResponse.json({ ok: true }), {
        userId: user.id,
        profileId: null,
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

export const runtime = 'edge';
