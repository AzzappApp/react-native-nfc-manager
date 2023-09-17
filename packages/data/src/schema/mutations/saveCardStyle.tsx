import ERRORS from '@azzapp/shared/errors';
import { updateProfile } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const saveCardStyle: MutationResolvers['saveCardStyle'] = async (
  _,
  { input },
  { auth, loaders, cardUpdateListener },
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
    cardStyle: input,
    // reenable after beta, we made a mistake and forgot to add this column
    // updatedAt: new Date(),
    lastCardUpdate: new Date(),
    lastContactCardUpdate: new Date(),
  };
  try {
    await updateProfile(profileId, updates);
  } catch (e) {
    throw new Error(ERRORS.INVALID_REQUEST);
  }
  cardUpdateListener(profile.userName);
  return {
    profile: {
      ...profile,
      ...updates,
    },
  };
};

export default saveCardStyle;
