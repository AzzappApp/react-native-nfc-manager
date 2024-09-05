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

const getWebCardProfile = async (webCardId: string) => {
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

export const hasWebCardProfileEditorRight = async (webCardId: string) => {
  const profile = await getWebCardProfile(webCardId);
  return !!profile && profileHasEditorRight(profile.profileRole);
};

export const hasWebCardProfileAdminRight = async (webCardId: string) => {
  const profile = await getWebCardProfile(webCardId);
  return !!profile && profileHasAdminRight(profile.profileRole);
};

export const hasWebCardOwnerProfile = async (webCardId: string) => {
  const profile = await getWebCardProfile(webCardId);
  return !!profile && profileIsOwner(profile.profileRole);
};
