import ERRORS from '@azzapp/shared/errors';
import { updateProfile } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const saveCardColors: MutationResolvers['saveCardColors'] = async (
  _,
  { input },
  { auth, loaders, cardUsernamesToRevalidate },
) => {
  const profileId = auth.profileId;
  if (!profileId) {
    throw new Error(ERRORS.UNAUTORIZED);
  }
  const profile = await loaders.Profile.load(profileId);
  if (!profile) {
    throw new Error(ERRORS.INVALID_REQUEST);
  }

  const updates = {
    cardColors: input,
    updatedAt: new Date(),
    lastCardUpdate: new Date(),
    lastContactCardUpdate: new Date(),
  };
  try {
    await updateProfile(profileId, updates);
  } catch (e) {
    throw new Error(ERRORS.INVALID_REQUEST);
  }
  cardUsernamesToRevalidate.add(profile.userName);
  return {
    profile: {
      ...profile,
      ...updates,
    },
  };
};

export default saveCardColors;
