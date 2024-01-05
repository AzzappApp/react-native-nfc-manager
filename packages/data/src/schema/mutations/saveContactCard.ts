import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import { buildDefaultContactCard, updateProfile } from '#domains';
import type { Profile } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const saveContactCard: MutationResolvers['saveContactCard'] = async (
  _,
  { input: { displayedOnWebCard, isPrivate, avatarId, ...data } },
  { auth, loaders },
) => {
  const { profileId, userId } = auth;
  if (!profileId || !userId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const profile = await loaders.Profile.load(profileId);
  if (!profile) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const webCard = await loaders.WebCard.load(profile.webCardId);

  if (!webCard) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  if ('birthday' in data) {
    data.birthday = data.birthday ?? undefined;
  }

  const updates: Partial<Profile> = {
    contactCard: {
      ...(profile.contactCard ??
        (await buildDefaultContactCard(webCard, userId))),
      ...(data as Partial<Profile['contactCard']>),
    },
    lastContactCardUpdate: new Date(),
    contactCardIsPrivate: !!isPrivate,
    contactCardDisplayedOnWebCard: !!displayedOnWebCard,
  };

  updates.avatarId = avatarId;

  try {
    await updateProfile(profileId, updates);
  } catch (e) {
    console.error(e);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }

  return {
    profile: {
      ...profile,
      ...updates,
    },
  };
};

export default saveContactCard;
