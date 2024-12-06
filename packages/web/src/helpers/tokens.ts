import { headers } from 'next/headers';
import { seal, unseal } from '@azzapp/shared/crypto';
import ERRORS from '@azzapp/shared/errors';
import { AZZAPP_SERVER_HEADER } from '@azzapp/shared/urlHelpers';

const TOKEN_EXP_TIME = 3600 * 1000;
const REFRESH_TOKEN_EXP_TIME = 7 * 24 * 3600 * 1000;
const TOKEN_SECRET = process.env.TOKEN_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;

export type SessionData = {
  userId: string;
};

export const generateTokens = async (data: SessionData) => {
  const token = await seal(data, TOKEN_SECRET, {
    ttl: TOKEN_EXP_TIME,
  });

  const refreshToken = await seal(data, REFRESH_TOKEN_SECRET, {
    ttl: REFRESH_TOKEN_EXP_TIME,
  });

  return { token, refreshToken };
};

export const verifyToken = (token: string): Promise<SessionData> =>
  unseal(token, TOKEN_SECRET, { ttl: TOKEN_EXP_TIME }) as Promise<any>;

export const refreshTokens = async (refreshToken: string) => {
  const data: any = await unseal(refreshToken, REFRESH_TOKEN_SECRET, {
    ttl: REFRESH_TOKEN_EXP_TIME,
  });

  if (typeof data !== 'object' || typeof data?.userId !== 'string') {
    throw new Error('Invalid token');
  }
  const { userId } = data;
  return generateTokens({ userId });
};

export const getSessionData = async (): Promise<SessionData | null> => {
  const token = headers().get('authorization')?.split(' ')?.[1] ?? null;
  if (token) {
    try {
      const { userId } = await verifyToken(token);
      return { userId };
    } catch {
      throw new Error(ERRORS.INVALID_TOKEN);
    }
  }
  return null;
};

export const checkServerAuth = () => {
  const token = headers().get(AZZAPP_SERVER_HEADER) ?? null;
  if (token !== process.env.API_SERVER_TOKEN) {
    throw new Error(ERRORS.INVALID_TOKEN);
  }
};
