import { headers } from 'next/headers';
import { getSessionUser } from '@azzapp/schema/GraphQLContext';
import { seal, unseal } from '@azzapp/shared/crypto';
import ERRORS from '@azzapp/shared/errors';
import env from '#env';

const TOKEN_EXP_TIME = 3600 * 1000;
const REFRESH_TOKEN_EXP_TIME = 7 * 24 * 3600 * 1000;
const TOKEN_SECRET = env.TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = env.REFRESH_TOKEN_SECRET;

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
  unseal(token, TOKEN_SECRET) as Promise<any>;

export const refreshTokens = async (refreshToken: string) => {
  const user = await getSessionUser();
  if (!user) {
    throw new Error(ERRORS.UNAUTHORIZED);
  }
  const data: any = await unseal(refreshToken, REFRESH_TOKEN_SECRET);

  if (typeof data !== 'object' || typeof data?.userId !== 'string') {
    throw new Error('Invalid token');
  }
  const { userId } = data;
  return generateTokens({ userId });
};

export const getSessionData = async (): Promise<SessionData | null> => {
  const token = (await headers()).get('authorization')?.split(' ')?.[1] ?? null;
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
