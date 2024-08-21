import { GraphQLError } from 'graphql';
import { fromGlobalId } from 'graphql-relay';
import { cancelSubscription, transaction, updateProfile } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import type { MutationResolvers } from '#/__generated__/types';

const acceptOwnership: MutationResolvers['acceptOwnership'] = async (
  _,
  { profileId: gqlProfileId },
  { auth, loaders },
) => {
  const { userId } = auth;
  const profileId = fromGlobalId(gqlProfileId).id;

  const [profile, user] = await Promise.all([
    loaders.Profile.load(profileId),
    userId && loaders.User.load(userId),
  ]);

  if (!user || !profile?.promotedAsOwner) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const webCard = await loaders.WebCard.load(profile.webCardId);
  if (!webCard) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const owner = await loaders.webCardOwners.load(webCard.id);
  const updatedProfile = await transaction(async () => {
    if (owner) {
      await updateProfile(owner.id, { profileRole: 'admin' });
      await cancelSubscription(owner.id, profile.webCardId);
    }
    await updateProfile(profileId, {
      profileRole: 'owner',
      promotedAsOwner: false,
      invited: false,
    });

    return {
      ...profile,
      profileRole: 'owner',
      promotedAsOwner: false,
      invited: false,
    } as const;
  });

  loaders.Profile.prime(profileId, updatedProfile);

  return {
    profile: updatedProfile,
  };
};

export default acceptOwnership;
