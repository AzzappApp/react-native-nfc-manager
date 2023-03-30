import { headers } from 'next/headers';
import ERRORS from '@azzapp/shared/errors';
import { getSession } from './session';
import { verifyToken } from './tokens';

export type Viewer =
  | {
      isAnonymous: false;
      userId: string;
      profileId?: string | null;
    }
  | { isAnonymous: true };

export const getViewer = async (): Promise<Viewer> => {
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
  return viewer.isAnonymous ? null : viewer.profileId;
};
