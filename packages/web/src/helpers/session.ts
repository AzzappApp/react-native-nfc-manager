import ERRORS from '@azzapp/shared/lib/errors';
import cuid from 'cuid';
import { withIronSessionApiRoute, withIronSessionSsr } from 'iron-session/next';
import { verifyToken } from './tokensHelpers';
import type { IncomingMessage } from 'http';
import type { IronSessionOptions } from 'iron-session';
import type { GetServerSideProps, NextApiHandler } from 'next';

export const sessionOptions: IronSessionOptions = {
  password: process.env.SECRET_COOKIE_PASSWORD as string,
  cookieName: 'srve-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};

// This is where we specify the typings of req.session.*
declare module 'iron-session' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface IronSessionData {
    userId?: string;
    isAnonymous?: boolean;
    locale?: string;
    location?: { lat: number; lng: number };
  }
}

export const withSessionAPIRoute = (handler: NextApiHandler) => {
  return withIronSessionApiRoute(handler, sessionOptions);
};

export const withSessionSsr = (handler: GetServerSideProps) => {
  return withIronSessionSsr(handler, sessionOptions);
};

export type AuthInfos = {
  userId: string;
  isAnonymous: boolean;
};

export const getRequestAuthInfos = async (
  req: IncomingMessage,
): Promise<AuthInfos> => {
  let userId: string;
  let isAnonymous = false;
  const token = getTokensFromRequest(req);
  if (token) {
    try {
      const data = verifyToken(token);
      userId = data.userId;
    } catch (e) {
      throw new Error(ERRORS.INVALID_TOKEN);
    }
  } else if (req.session.userId) {
    userId = req.session.userId;
    isAnonymous = req.session.isAnonymous ?? true;
  } else {
    userId = cuid();
    isAnonymous = true;
    req.session.userId = userId;
    req.session.isAnonymous = true;
    await req.session.save();
  }
  return {
    userId,
    isAnonymous,
  };
};

const getTokensFromRequest = (req: IncomingMessage) =>
  req.headers.authorization?.split(' ')?.[1] ?? null;
