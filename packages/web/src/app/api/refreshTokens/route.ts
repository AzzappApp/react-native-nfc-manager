import { NextResponse } from 'next/server';
import { withAxiom } from 'next-axiom';
import ERRORS from '@azzapp/shared/errors';
import cors from '#helpers/cors';
import { refreshTokens } from '#helpers/tokens';

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
  } catch {
    return NextResponse.json(
      { message: ERRORS.INVALID_TOKEN },
      { status: 401 },
    );
  }
};

export const { POST, OPTIONS } = cors({ POST: withAxiom(refreshTokensApi) });
