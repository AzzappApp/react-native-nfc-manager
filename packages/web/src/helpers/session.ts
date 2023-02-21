import ERRORS from '@azzapp/shared/lib/errors';
import { unsealData } from 'iron-session';
import { withIronSessionApiRoute } from 'iron-session/next';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { verifyToken } from './tokensHelpers';
import type { ViewerInfos } from '@azzapp/data/lib/schema/GraphQLContext';
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
    profileId?: string;
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

export const getAuthInfos = async (): Promise<ViewerInfos> => {
  const sessionData = await getSessionData();
  if (sessionData?.userId && sessionData?.profileId) {
    return {
      userId: sessionData.userId,
      profileId: sessionData.profileId,
      isAnonymous: false,
    };
  }

  return { isAnonymous: true };
};

export const getRequestAuthInfos = async (
  req: IncomingMessage,
): Promise<ViewerInfos> => {
  const token = getTokensFromRequest(req);
  if (token) {
    try {
      const data = verifyToken(token);
      return { ...data, isAnonymous: false };
    } catch (e) {
      throw new Error(ERRORS.INVALID_TOKEN);
    }
  }
  if (req.session.userId && req.session.profileId) {
    return {
      userId: req.session.userId,
      profileId: req.session.profileId,
      isAnonymous: false,
    };
  }

  return { isAnonymous: true };
};

const getTokensFromRequest = (req: IncomingMessage) =>
  req.headers.authorization?.split(' ')?.[1] ?? null;
