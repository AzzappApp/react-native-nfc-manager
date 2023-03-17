import { seal, unseal } from './crypto';

const TOKEN_EXP_TIME = 3600 * 1000;
const REFREH_TOKEN_EXP_TIME = 7 * 24 * 3600 * 1000;
const TOKEN_SECRET = process.env.TOKEN_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;

export const generateTokens = async ({
  userId,
  profileId,
}: {
  userId: string;
  profileId: string;
}) => {
  const data = { userId, profileId };
  const token = await seal(data, TOKEN_SECRET, {
    ttl: TOKEN_EXP_TIME,
  });

  const refreshToken = await seal(data, REFRESH_TOKEN_SECRET, {
    ttl: REFREH_TOKEN_EXP_TIME,
  });

  return { token, refreshToken };
};

export const verifyToken = (
  token: string,
): Promise<{ userId: string; profileId: string }> =>
  unseal(token, TOKEN_SECRET, { ttl: TOKEN_EXP_TIME }) as Promise<any>;

export const refreshTokens = async (refreshToken: string) => {
  const data: any = await unseal(refreshToken, REFRESH_TOKEN_SECRET, {
    ttl: TOKEN_EXP_TIME,
  });

  if (
    typeof data !== 'object' ||
    typeof data?.userId !== 'string' ||
    typeof data?.profileId !== 'string'
  ) {
    throw new Error('Invalid token');
  }
  return generateTokens(data);
};
