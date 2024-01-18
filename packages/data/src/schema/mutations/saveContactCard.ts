import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import { buildDefaultContactCard, updateProfile } from '#domains';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { Profile } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const saveContactCard: MutationResolvers['saveContactCard'] = async (
  _,
  { input: { profileId: gqlProfileId, contactCard } },
  { auth, loaders },
) => {
  const { userId } = auth;
  if (!userId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }
  const profileId = fromGlobalIdWithType(gqlProfileId, 'Profile');
  const profile = await loaders.Profile.load(profileId);
  if (!profile) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const webCard = await loaders.WebCard.load(profile.webCardId);

  if (!webCard) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const updates: Partial<Profile> = {
    contactCard: {
      ...(profile.contactCard ??
        (await buildDefaultContactCard(webCard, userId))),
      ...contactCard,
    },
    lastContactCardUpdate: new Date(),
  };

  updates.avatarId = contactCard.avatarId ?? profile.avatarId;

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
