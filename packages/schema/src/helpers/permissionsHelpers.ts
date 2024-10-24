import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import {
  profileHasAdminRight,
  profileHasEditorRight,
  profileIsOwner,
} from '@azzapp/shared/profileHelpers';
import { getSessionInfos } from '#GraphQLContext';
import { profileByWebCardIdAndUserIdLoader } from '#loaders';

export type ProtectedResolver<T> = {
  [P in Exclude<keyof T, '__isTypeOf'>]-?: T[P];
};

export const getWebCardProfile = async (webCardId: string) => {
  const { userId } = getSessionInfos();
  if (!userId) {
    return null;
  }
  return profileByWebCardIdAndUserIdLoader.load({
    webCardId,
    userId,
  });
};

export const hasWebCardProfileRight = async (webCardId: string) => {
  return (await getWebCardProfile(webCardId)) !== null;
};

export const checkWebCardProfileEditorRight = async (webCardId: string) => {
  const profile = await getWebCardProfile(webCardId);
  if (!!profile && !profileHasEditorRight(profile.profileRole)) {
    throw new GraphQLError(ERRORS.FORBIDDEN, {
      extensions: {
        role: profile?.profileRole,
      },
    });
  }
};

export const checkWebCardProfileAdminRight = async (webCardId: string) => {
  const profile = await getWebCardProfile(webCardId);
  if (!!profile && !profileHasAdminRight(profile.profileRole)) {
    throw new GraphQLError(ERRORS.FORBIDDEN, {
      extensions: {
        role: profile?.profileRole,
      },
    });
  }
};

export const checkWebCardOwnerProfile = async (webCardId: string) => {
  const profile = await getWebCardProfile(webCardId);
  if (!!profile && !profileIsOwner(profile.profileRole)) {
    throw new GraphQLError(ERRORS.FORBIDDEN, {
      extensions: {
        role: profile?.profileRole,
      },
    });
  }
};
