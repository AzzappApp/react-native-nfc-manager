import { NextResponse } from 'next/server';
import { getUserByEmail, getUserByPhoneNumber } from '@azzapp/data/domains';
import ERRORS from '@azzapp/shared/errors';
import {
  isInternationalPhoneNumber,
  isValidEmail,
} from '@azzapp/shared/stringHelpers';

type ChangePasswordBody = {
  password: string;
  credential: string;
  token: string;
};

export const POST = async (req: Request) => {
  const { credential } = (await req.json()) as ChangePasswordBody;
  if (!credential) {
    return NextResponse.json(
      { message: ERRORS.INVALID_REQUEST },
      { status: 400 },
    );
  }
  try {
    let user;
    if (!isValidEmail(credential)) {
      user = await getUserByEmail(credential);
    }
    if (user == null && isInternationalPhoneNumber(credential)) {
      user = await getUserByPhoneNumber(credential);
    }
    if (user == null) {
      return NextResponse.json(
        { message: ERRORS.USER_NOT_FOUND },
        { status: 400 },
      );
    }
    //TODO: send an email or an sms
    return NextResponse.json({ ok: true });
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
