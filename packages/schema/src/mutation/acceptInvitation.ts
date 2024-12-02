import { GraphQLError } from 'graphql';
import { updateProfile } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { profileLoader } from '#loaders';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#/__generated__/types';

const acceptInvitationMutation: MutationResolvers['acceptInvitation'] = async (
  _,
  { profileId: gqlProfileId },
) => {
  const profileId = fromGlobalIdWithType(gqlProfileId, 'Profile');
  const profile = await profileLoader.load(profileId);

  if (!profile) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  await updateProfile(profileId, {
    invited: false,
    lastContactCardUpdate: profile.createdAt,
  });

  return {
    profile: {
      ...profile,
      invited: false,
    },
  };
};

export default acceptInvitationMutation;
