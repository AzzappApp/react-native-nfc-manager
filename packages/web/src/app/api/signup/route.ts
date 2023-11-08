import * as Sentry from '@sentry/nextjs';
import { bcrypt, bcryptVerify } from 'hash-wasm';
import { NextResponse } from 'next/server';
import {
  createUser,
  getUserByEmail,
  getUserByPhoneNumber,
  getUserProfiles,
} from '@azzapp/data/domains';
import { getCrypto } from '@azzapp/shared/crypto';
import ERRORS from '@azzapp/shared/errors';
import {
  formatPhoneNumber,
  isInternationalPhoneNumber,
  isValidEmail,
} from '@azzapp/shared/stringHelpers';
import { handleSigninAuthMethod } from '#helpers/auth';
import { generateTokens } from '#helpers/tokens';

type SignupBody = {
  email?: string | null;
  phoneNumber?: string | null;
  password?: string;
};

export const POST = async (req: Request) => {
  const { email, phoneNumber, password } =
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
        //try to login the user
        try {
          //TODO: review Security: Use a constant-time compairson function like crypto.timingSafeEqual()
          // instead of bcrypt.compareSync() to compare passwords. This helps prevent timing attacks.
          if (
            user?.password &&
            (await bcryptVerify({ password, hash: user.password }))
          ) {
            // we can log the user
            const [profile] = await getUserProfiles(user.id);
            return await handleSigninAuthMethod(user, profile);
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
      }
    }

    if (isInternationalPhoneNumber(phoneNumber)) {
      const user = await getUserByPhoneNumber(formatPhoneNumber(phoneNumber!));
      if (user != null) {
        //try to login the user
        try {
          //TODO: review Security: Use a constant-time compairson function like crypto.timingSafeEqual()
          // instead of bcrypt.compareSync() to compare passwords. This helps prevent timing attacks.
          if (
            user?.password &&
            (await bcryptVerify({
              password,
              hash: user.password,
            }))
          ) {
            // we can log the user
            const [profile] = await getUserProfiles(user.id);
            await handleSigninAuthMethod(user, profile);
          }
        } catch (error) {
          return NextResponse.json(
            { message: ERRORS.PHONENUMBER_ALREADY_EXISTS },
            { status: 400 },
          );
        }
        return NextResponse.json(
          { message: ERRORS.PHONENUMBER_ALREADY_EXISTS },
          { status: 400 },
        );
      }
    }

    const salt = new Uint8Array(16);
    getCrypto().getRandomValues(salt);

    const userId = await createUser({
      email: email ?? null,
      phoneNumber: phoneNumber?.replace(/\s/g, '') ?? null,
      password: await bcrypt({
        password,
        salt,
        costFactor: 12,
      }),
      roles: null,
    });

    const { token, refreshToken } = await generateTokens({
      userId,
    });
    return NextResponse.json({ ok: true, token, refreshToken });
  } catch (error) {
    console.error(error);
    Sentry.captureException(error);
    return NextResponse.json(
      { message: ERRORS.INTERNAL_SERVER_ERROR },
      { status: 500 },
    );
  }
};
