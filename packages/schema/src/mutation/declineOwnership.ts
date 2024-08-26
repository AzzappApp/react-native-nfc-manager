import { GraphQLError } from 'graphql';
import { fromGlobalId } from 'graphql-relay';
import { updateProfile } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { profileLoader } from '#loaders';
import type { MutationResolvers } from '#/__generated__/types';

const declineOwnershipMutation: MutationResolvers['declineOwnership'] = async (
  _,
  { profileId: gqlProfileId },
) => {
  const profileId = fromGlobalId(gqlProfileId).id;

  const profile = await profileLoader.load(profileId);

  if (!profile) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  await updateProfile(profileId, { promotedAsOwner: false });
  return { profile: { ...profile, promotedAsOwner: false } };
};

export default declineOwnershipMutation;
