import { headers } from 'next/headers';
import ERRORS from '@azzapp/shared/errors';
import { getSession } from './session';
import { verifyToken } from './tokens';

export type User =
  | {
      isAnonymous: false;
      userId: string;
    }
  | { isAnonymous: true };

export type Viewer = {
  profileId?: string | null;
};

export type SessionData = User & Viewer;

export const getSessionData = async (): Promise<SessionData> => {
  const token = headers().get('authorization')?.split(' ')?.[1] ?? null;
  if (token) {
    try {
      const data = await verifyToken(token);
      return { ...data, isAnonymous: false };
    } catch (e) {
      throw new Error(ERRORS.INVALID_TOKEN);
    }
  }
  const session = await getSession();
  if (!session) {
    return { isAnonymous: true };
  }
  return session;
};

export const getProfileId = (viewer: Viewer) => {
  return viewer.profileId;
};
