import { GraphQLError } from 'graphql';
import { refreshContactsLastView } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { getSessionUser } from '#GraphQLContext';
import type { MutationResolvers } from '#__generated__/types';

type Mutation = MutationResolvers['updateContactsLastView'];

const updateContactsLastView: Mutation = async () => {
  const user = await getSessionUser();
  if (!user) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }
  await refreshContactsLastView(user.id);
  return true;
};

export default updateContactsLastView;
