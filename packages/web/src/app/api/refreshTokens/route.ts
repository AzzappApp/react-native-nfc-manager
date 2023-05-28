import { NextResponse } from 'next/server';
import { refreshTokens } from '@azzapp/auth/tokens';
import ERRORS from '@azzapp/shared/errors';
import cors from '#helpers/cors';

const refreshTokensApi = async (req: Request) => {
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

export const { POST, OPTIONS } = cors({ POST: refreshTokensApi });

export const runtime = 'edge';
