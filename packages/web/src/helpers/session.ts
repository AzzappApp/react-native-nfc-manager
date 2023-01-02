import ERRORS from '@azzapp/shared/lib/errors';
import cuid from 'cuid';
import { unsealData } from 'iron-session';
import { withIronSessionApiRoute } from 'iron-session/next';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { verifyToken } from './tokensHelpers';
import type { IncomingMessage } from 'http';
import type { IronSessionOptions } from 'iron-session';
import type { NextApiHandler } from 'next';

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

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
type IronSessionData = import('iron-session').IronSessionData;

export const getSessionData = cache(
  async (): Promise<IronSessionData | null> => {
    const found = cookies().get(sessionOptions.cookieName);

    if (!found) {
      return null;
    }

    const data = await unsealData(found.value, sessionOptions);

    return data;
  },
);

export const getAuthInfos = async () => {
  const sessionData = await getSessionData();
  if (!sessionData?.userId) {
    return {
      userId: cuid(),
      isAnonymous: true,
    };
  }
  return { userId: sessionData.userId, isAnonymous: false };
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
