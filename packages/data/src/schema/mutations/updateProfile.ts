import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import { isAdmin } from '@azzapp/shared/profileHelpers';
import { getUserProfileWithWebCardId, updateProfile } from '#domains';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { GraphQLContext } from '#index';
import type { MutationResolvers } from '#schema/__generated__/types';

// TODO why do we duplicate the avatarId in the profile and in the contactCard?
// TODO in general perhaps this mutation should be split into two: one for the profile and one for the contactCard
const updateProfileMutation: MutationResolvers['updateProfile'] = async (
  _,
  { input: { profileId: gqlProfileId, profileRole, contactCard, avatarId } },
  { auth, loaders }: GraphQLContext,
) => {
  const { userId } = auth;
  const targetProfileId = fromGlobalIdWithType(gqlProfileId, 'Profile');
  const targetProfile = await loaders.Profile.load(targetProfileId);

  if (!targetProfile) {
    throw new GraphQLError(ERRORS.PROFILE_DONT_EXISTS);
  }

  if (profileRole === 'owner') {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const currentProfile =
    userId &&
    (await getUserProfileWithWebCardId(userId, targetProfile.webCardId));

  if (!currentProfile) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  if (
    currentProfile.id !== targetProfileId &&
    !isAdmin(currentProfile.profileRole)
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

  await updateProfile(targetProfileId, {
    profileRole: profileRole ?? undefined,
    contactCard: {
      ...contactCard,
    },
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
