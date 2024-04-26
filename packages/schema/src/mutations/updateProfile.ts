import { GraphQLError } from 'graphql';
import { updateProfile } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { isAdmin, isOwner } from '@azzapp/shared/profileHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#/__generated__/types';
import type { GraphQLContext } from '#index';

// TODO why do we duplicate the avatarId in the profile and in the contactCard?
// TODO in general perhaps this mutation should be split into two: one for the profile and one for the contactCard
const updateProfileMutation: MutationResolvers['updateProfile'] = async (
  _,
  { profileId: gqlProfileId, input: { profileRole, contactCard } },
  { auth, loaders }: GraphQLContext,
) => {
  const { userId } = auth;
  const targetProfileId = fromGlobalIdWithType(gqlProfileId, 'Profile');
  const targetProfile = await loaders.Profile.load(targetProfileId);

  if (!targetProfile) {
    throw new GraphQLError(ERRORS.PROFILE_DONT_EXISTS);
  }

  const currentProfile =
    userId &&
    (await loaders.profileByWebCardIdAndUserId.load({
      userId,
      webCardId: targetProfile.webCardId,
    }));

  if (!currentProfile) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  if (profileRole === 'owner' && !isOwner(currentProfile.profileRole)) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  if (
    currentProfile.id !== targetProfileId &&
    (!isAdmin(currentProfile.profileRole) || currentProfile.invited)
  ) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  if (
    currentProfile.id === targetProfileId &&
    profileRole &&
    profileRole !== currentProfile.profileRole
  ) {
    // we don't allow to change profile role of the profile you are logged in
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const { avatarId, logoId, ...restContactCard } = contactCard || {};

  await updateProfile(targetProfileId, {
    profileRole: profileRole ?? undefined,
    contactCard: {
      ...restContactCard,
    },
    logoId,
    avatarId,
  });

  const updatedProfile = { ...targetProfile };
  if (profileRole) {
    updatedProfile.profileRole = profileRole;
  }
  if (avatarId) {
    updatedProfile.avatarId = avatarId;
  }
  if (contactCard) {
    updatedProfile.contactCard = {
      ...contactCard,
    };
  }

  return {
    profile: updatedProfile,
  };
};

export default updateProfileMutation;
