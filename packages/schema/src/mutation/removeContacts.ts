import { GraphQLError } from 'graphql';
import {
  getWebcardsMediaFromContactIds,
  referencesMedias,
  removeContacts,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { getSessionInfos } from '#GraphQLContext';
import { profileLoader } from '#loaders';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#__generated__/types';

type Mutation = MutationResolvers['removeContacts'];

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

  const contactIdsToRemove = input.contactIds.map(contactIdToRemove =>
    fromGlobalIdWithType(contactIdToRemove, 'Contact'),
  );

  const data = await getWebcardsMediaFromContactIds(contactIdsToRemove);
  if (data.length) {
    await referencesMedias([], data);
  }
  await removeContacts(profileId, contactIdsToRemove);

  return {
    removedContactIds: input.contactIds,
  };
};

export default removeFollowerMutation;
