import { GraphQLError } from 'graphql';
import {
  getWebcardsFromContactIds,
  getWebcardsMediaFromContactIds,
  referencesMedias,
  removeContactsbyIds,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { getSessionInfos } from '#GraphQLContext';
import { profileLoader } from '#loaders';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#__generated__/types';

type Mutation = MutationResolvers['removeContactsFromWebCard'];

const removeContactsFromWebCardMutation: Mutation = async (
  _,
  { profileId: gqlProfileId, input },
) => {
  const profileId = fromGlobalIdWithType(gqlProfileId, 'Profile');
  const contactIdsToRemove = input.contactIds.map(id =>
    fromGlobalIdWithType(id, 'Contact'),
  );
  const { userId } = getSessionInfos();
  if (!userId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }
  const profile = await profileLoader.load(profileId);
  if (profile?.userId !== userId) {
    throw new GraphQLError(ERRORS.FORBIDDEN);
  }
  const webcardIds = await getWebcardsFromContactIds(contactIdsToRemove);

  webcardIds.forEach(webCardId => {
    if (
      profile.webCardId !== webCardId ||
      (profile.webCardId === webCardId &&
        profile.profileRole !== 'owner' &&
        profile.profileRole !== 'admin')
    ) {
      throw new GraphQLError(ERRORS.FORBIDDEN);
    }
  });

  if (contactIdsToRemove.length > 0) {
    const data = await getWebcardsMediaFromContactIds(contactIdsToRemove);
    if (data.length) {
      await referencesMedias([], data);
    }
    await removeContactsbyIds(contactIdsToRemove);
  }

  return {
    removedContactIds: input.contactIds,
  };
};

export default removeContactsFromWebCardMutation;
