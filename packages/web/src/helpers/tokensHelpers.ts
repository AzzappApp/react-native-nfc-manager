import { sign, verify } from 'jsonwebtoken';

const TOKEN_EXP_TIME = '1h';
const REFREH_TOKEN_EXP_TIME = '7d';
const TOKEN_SECRET = process.env.TOKEN_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;

export const generateTokens = ({
  userId,
  profileId,
}: {
  userId: string;
  profileId: string;
}) => {
  const data = { userId, profileId };
  const token = sign(data, TOKEN_SECRET, {
    expiresIn: TOKEN_EXP_TIME,
  });
  const refreshToken = sign(data, REFRESH_TOKEN_SECRET, {
    expiresIn: REFREH_TOKEN_EXP_TIME,
  });

  return { token, refreshToken };
};

export const verifyToken = (
  token: string,
): { userId: string; profileId: string } => verify(token, TOKEN_SECRET) as any;

export const refreshTokens = (refreshToken: string) => {
  const data = verify(refreshToken, REFRESH_TOKEN_SECRET) as {
    userId: string;
    profileId: string;
  };

  return generateTokens(data);
};
