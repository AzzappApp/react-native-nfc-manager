import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import { updateProfile } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const publishCard: MutationResolvers['publishCard'] = async (
  _,
  _args,
  { auth, loaders, cardUsernamesToRevalidate },
) => {
  const profileId = auth.profileId;
  if (!profileId) {
    throw new GraphQLError(ERRORS.UNAUTORIZED);
  }
  const profile = await loaders.Profile.load(profileId);
  if (!profile) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const updates = {
    cardIsPublished: true,
    updatedAt: new Date(),
    lastCardUpdate: new Date(),
    lastContactCardUpdate: new Date(),
  };
  try {
    await updateProfile(profileId, updates);
  } catch (e) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }
  cardUsernamesToRevalidate.add(profile.userName);
  return {
    profile: {
      ...profile,
      ...updates,
    },
  };
};

export default publishCard;
