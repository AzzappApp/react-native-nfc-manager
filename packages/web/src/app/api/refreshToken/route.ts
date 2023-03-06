import { NextResponse } from 'next/server';
import ERRORS from '@azzapp/shared/errors';
import { refreshTokens } from '#helpers/tokensHelpers';

export const POST = async (req: Request) => {
  const { refreshToken: oldToken } = await req.json();
  if (!oldToken) {
    return NextResponse.json(
      { message: ERRORS.INVALID_REQUEST },
      { status: 400 },
    );
  }
  try {
    const { refreshToken, token } = await refreshTokens(oldToken);
    return NextResponse.json({ ok: true, token, refreshToken });
  } catch (e) {
    return NextResponse.json(
      { message: ERRORS.UNAUTORIZED_INVALID_ACCESS_TOKEN },
      { status: 401 },
    );
  }
};

export const runtime = 'edge';
