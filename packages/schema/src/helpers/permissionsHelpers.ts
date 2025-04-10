import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import {
  profileHasAdminRight,
  profileHasEditorRight,
  profileIsOwner,
} from '@azzapp/shared/profileHelpers';
import { getSessionInfos } from '#GraphQLContext';
import { profileByWebCardIdAndUserIdLoader, webCardLoader } from '#loaders';

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
  if (
    !profile ||
    profile.invited ||
    !profileHasEditorRight(profile.profileRole)
  ) {
    throw new GraphQLError(ERRORS.FORBIDDEN, {
      extensions: {
        role: profile?.profileRole,
      },
    });
  }
  return profile;
};

export const checkWebCardHasCover = async (webCardId: string) => {
  const webCard = await webCardLoader.load(webCardId);
  if (!webCard || webCard.coverIsPredefined) {
    throw new GraphQLError(ERRORS.WEBCARD_NO_COVER);
  }
};

export const checkWebCardProfileAdminRight = async (webCardId: string) => {
  const profile = await getWebCardProfile(webCardId);
  if (
    !profile ||
    profile.invited ||
    !profileHasAdminRight(profile.profileRole)
  ) {
    throw new GraphQLError(ERRORS.FORBIDDEN, {
      extensions: {
        role: profile?.profileRole,
      },
    });
  }
  return profile;
};

export const checkWebCardOwnerProfile = async (webCardId: string) => {
  const profile = await getWebCardProfile(webCardId);
  if (!profile || !profileIsOwner(profile.profileRole)) {
    throw new GraphQLError(ERRORS.FORBIDDEN, {
      extensions: {
        role: profile?.profileRole,
      },
    });
  }
  return profile;
};
