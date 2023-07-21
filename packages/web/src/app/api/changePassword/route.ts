import * as bcrypt from 'bcrypt-ts';
import { NextResponse } from 'next/server';
import {
  getByTokenValue,
  updateUser,
  getUsersByIds,
  deleteToken,
  getUserByEmail,
} from '@azzapp/data/domains';
import ERRORS from '@azzapp/shared/errors';

type ChangePasswordBody = {
  password: string;
  token: string;
  issuer: string;
};

export const POST = async (req: Request) => {
  const { password, token, issuer } = (await req.json()) as ChangePasswordBody;
  if (!password || !token) {
    return NextResponse.json(
      { message: ERRORS.INVALID_REQUEST },
      { status: 400 },
    );
  }

  const foundToken = await getByTokenValue(token, issuer);

  if (
    foundToken &&
    foundToken.createdAt.getTime() > Date.now() - 1000 * 60 * 60 * 24
  ) {
    await getUserByEmail(issuer);
    const [user] = await getUsersByIds([foundToken.userId]);
    if (user) {
      await updateUser(foundToken.userId, {
        password: bcrypt.hashSync(password, 12),
      });
      await deleteToken(foundToken.userId);
      return NextResponse.json({ ok: true });
    }
  }

  return NextResponse.json(
    { message: ERRORS.INTERNAL_SERVER_ERROR },
    { status: 500 },
  );
};
