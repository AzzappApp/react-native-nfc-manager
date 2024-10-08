import { GraphQLError } from 'graphql';
import { getContactByProfiles, removeContact } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { getSessionInfos } from '#GraphQLContext';
import { profileLoader } from '#loaders';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#__generated__/types';

type Mutation = MutationResolvers['removeContact'];

const removeFollowerMutation: Mutation = async (
  _,
  { profileId: gqlProfileId, input },
) => {
  const profileId = fromGlobalIdWithType(gqlProfileId, 'Profile');

  const { userId } = getSessionInfos();
  if (!userId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const profile = await profileLoader.load(profileId);

  if (profile?.userId !== userId) {
    throw new GraphQLError(ERRORS.FORBIDDEN);
  }

  const profileIdToRemove = fromGlobalIdWithType(input.profileId, 'Profile');

  const contactToRemove = await getContactByProfiles({
    owner: profileId,
    contact: profileIdToRemove,
  });

  if (!contactToRemove) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  await removeContact({
    owner: profileId,
    contact: profileIdToRemove,
  });

  return {
    removedContactId: contactToRemove.id,
  };
};

export default removeFollowerMutation;
