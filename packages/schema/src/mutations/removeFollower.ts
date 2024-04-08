import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import { CannotAccessWebCardException, removeFollower } from '#use-cases';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#/__generated__/types';

type Mutation = MutationResolvers['removeFollower'];

const removeFollowerMutation: Mutation = async (_, params, context) => {
  const webCardId = fromGlobalIdWithType(params.webCardId, 'WebCard');
  const removedFollowerId = fromGlobalIdWithType(
    params.input.removedFollowerId,
    'WebCard',
  );

  try {
    await removeFollower({
      removedFollowerId,
      webCardId,
      loaders: context.loaders,
    });
  } catch (e) {
    if (e instanceof CannotAccessWebCardException) {
      throw new GraphQLError(ERRORS.FORBIDDEN);
    }
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }

  return { removedFollowerId };
};

export default removeFollowerMutation;
