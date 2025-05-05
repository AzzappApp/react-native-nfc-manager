import { GraphQLError } from 'graphql';
import { refreshContactsLastView } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { getSessionUser } from '#GraphQLContext';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#__generated__/types';

type Mutation = MutationResolvers['updateContactsLastView'];

const updateContactsLastView: Mutation = async (
  _,
  { profileId: gqlProfileId },
) => {
  const profileId = fromGlobalIdWithType(gqlProfileId, 'Profile');
  const user = await getSessionUser();
  if (!user) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }
  await refreshContactsLastView(profileId);
  return true;
};

export default updateContactsLastView;
