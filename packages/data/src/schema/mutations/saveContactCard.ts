import ERRORS from '@azzapp/shared/errors';
import { buildDefaultContactCard, updateProfile } from '#domains';
import type { Profile } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const saveContactCard: MutationResolvers['saveContactCard'] = async (
  _,
  { input: { displayedOnWebCard, isPrivate, ...data } },
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

  const updates: Partial<Profile> = {
    contactCard: {
      ...(profile.contactCard ?? (await buildDefaultContactCard(profile))),
      ...data,
    },
    lastContactCardUpdate: new Date(),
    contactCardIsPrivate: !!isPrivate,
    contactCardDisplayedOnWebCard: !!displayedOnWebCard,
  };
  try {
    await updateProfile(profileId, updates);
  } catch (e) {
    console.error(e);
    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  }

  cardUsernamesToRevalidate.add(profile.userName);

  return {
    profile: {
      ...profile,
      ...updates,
    } as Profile,
  };
};

export default saveContactCard;
